import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { RedisClientType } from 'redis';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const OTP_TTL_SECONDS = 5 * 60;
const PASSWORD_RESET_TTL_SECONDS = 60 * 60;

const JWT_SECRET = process.env.JWT_SECRET ?? 'smartbiz-dev-secret';

type AuthUser = {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  roles: string[];
  createdAt: string;
};

type SessionRecord = {
  sessionId: string;
  userId: string;
  email: string;
  roles: string[];
  createdAt: string;
};

type AuthResult = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresInSeconds: number;
};

const users = new Map<string, AuthUser>();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function userKey(email: string) {
  return normalizeEmail(email);
}

function sessionKey(sessionId: string) {
  return `smartbiz:auth:session:${sessionId}`;
}

function userSessionsKey(userId: string) {
  return `smartbiz:auth:user-sessions:${userId}`;
}

function emailVerificationKey(token: string) {
  return `smartbiz:auth:verify-email:${token}`;
}

function passwordResetKey(token: string) {
  return `smartbiz:auth:password-reset:${token}`;
}

function otpChallengeKey(challengeId: string) {
  return `smartbiz:auth:otp:${challengeId}`;
}

function signAccessToken(user: AuthUser, sessionId: string) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      sessionId,
      roles: user.roles
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function signRefreshToken(user: AuthUser, sessionId: string) {
  return jwt.sign(
    {
      sub: user.id,
      sessionId
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function createAuthResult(redis: RedisClientType, user: AuthUser): Promise<AuthResult> {
  const sessionId = randomUUID();
  const session: SessionRecord = {
    sessionId,
    userId: user.id,
    email: user.email,
    roles: user.roles,
    createdAt: new Date().toISOString()
  };

  const accessToken = signAccessToken(user, sessionId);
  const refreshToken = signRefreshToken(user, sessionId);

  await redis.set(sessionKey(sessionId), JSON.stringify(session), {
    EX: ACCESS_TOKEN_TTL_SECONDS
  });
  await redis.sAdd(userSessionsKey(user.id), sessionId);
  await redis.expire(userSessionsKey(user.id), REFRESH_TOKEN_TTL_SECONDS);

  return {
    accessToken,
    refreshToken,
    sessionId,
    expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS
  };
}

async function getUserSessions(redis: RedisClientType, userId: string) {
  const sessionIds = await redis.sMembers(userSessionsKey(userId));
  if (!sessionIds.length) {
    return [];
  }

  return sessionIds;
}

async function invalidateAllSessions(redis: RedisClientType, userId: string) {
  const sessionIds = await getUserSessions(redis, userId);
  if (sessionIds.length) {
    await Promise.all(sessionIds.map((sessionId) => redis.del(sessionKey(sessionId))));
  }
  await redis.del(userSessionsKey(userId));
}

async function issueEmailVerification(redis: RedisClientType, user: AuthUser) {
  const token = randomUUID();
  await redis.set(emailVerificationKey(token), user.id, {
    EX: 60 * 60
  });

  return token;
}

async function issuePasswordResetToken(redis: RedisClientType, user: AuthUser) {
  const token = randomUUID();
  await redis.set(passwordResetKey(token), user.id, {
    EX: PASSWORD_RESET_TTL_SECONDS
  });

  return token;
}

async function issueOtpChallenge(redis: RedisClientType, user: AuthUser) {
  const challengeId = randomUUID();
  const otp = String(Math.floor(100000 + Math.random() * 900000));

  await redis.set(
    otpChallengeKey(challengeId),
    JSON.stringify({ userId: user.id, otp }),
    { EX: OTP_TTL_SECONDS }
  );

  return { challengeId, otp };
}

function getUserByEmail(email: string) {
  return users.get(userKey(email));
}

function getUserById(userId: string) {
  return [...users.values()].find((user) => user.id === userId);
}

export async function registerUser(redis: RedisClientType, input: {
  email: string;
  password: string;
  roles?: string[];
  mfaEnabled?: boolean;
}) {
  const email = normalizeEmail(input.email);
  if (users.has(email)) {
    throw new Error('User already exists');
  }

  const user: AuthUser = {
    id: randomUUID(),
    email,
    passwordHash: await bcrypt.hash(input.password, 12),
    emailVerified: false,
    mfaEnabled: Boolean(input.mfaEnabled),
    roles: input.roles?.length ? input.roles : ['Employee'],
    createdAt: new Date().toISOString()
  };

  users.set(email, user);

  const verificationToken = await issueEmailVerification(redis, user);

  return {
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      roles: user.roles,
      createdAt: user.createdAt
    },
    emailVerificationRequired: true,
    verificationToken: process.env.NODE_ENV === 'production' ? undefined : verificationToken
  };
}

export async function verifyEmail(redis: RedisClientType, token: string) {
  const userId = await redis.get(emailVerificationKey(token));
  if (!userId) {
    throw new Error('Invalid or expired verification token');
  }

  const user = getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.emailVerified = true;
  await redis.del(emailVerificationKey(token));

  return {
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      roles: user.roles,
      createdAt: user.createdAt
    }
  };
}

export async function loginUser(redis: RedisClientType, input: { email: string; password: string }) {
  const user = getUserByEmail(input.email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (!user.emailVerified) {
    throw new Error('Email is not verified');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new Error('Invalid credentials');
  }

  if (user.mfaEnabled) {
    const challenge = await issueOtpChallenge(redis, user);
    return {
      mfaRequired: true,
      challengeId: challenge.challengeId,
      otp: process.env.NODE_ENV === 'production' ? undefined : challenge.otp,
      otpExpiresInSeconds: OTP_TTL_SECONDS
    };
  }

  return createAuthResult(redis, user);
}

export async function verifyOtp(redis: RedisClientType, input: { challengeId: string; otp: string }) {
  const rawChallenge = await redis.get(otpChallengeKey(input.challengeId));
  if (!rawChallenge) {
    throw new Error('OTP challenge expired');
  }

  const parsedChallenge = JSON.parse(rawChallenge) as { userId: string; otp: string };
  if (parsedChallenge.otp !== input.otp) {
    throw new Error('Invalid OTP');
  }

  const user = getUserById(parsedChallenge.userId);
  if (!user) {
    throw new Error('User not found');
  }

  await redis.del(otpChallengeKey(input.challengeId));
  return createAuthResult(redis, user);
}

export async function refreshAccessToken(redis: RedisClientType, input: { refreshToken: string }) {
  const payload = jwt.verify(input.refreshToken, JWT_SECRET) as jwt.JwtPayload & {
    sub?: string;
    sessionId?: string;
  };

  if (!payload.sub || !payload.sessionId) {
    throw new Error('Invalid refresh token');
  }

  const session = await redis.get(sessionKey(payload.sessionId));
  if (!session) {
    throw new Error('Session expired or revoked');
  }

  const user = getUserById(payload.sub);
  if (!user) {
    throw new Error('User not found');
  }

  await redis.expire(sessionKey(payload.sessionId), ACCESS_TOKEN_TTL_SECONDS);
  return {
    accessToken: signAccessToken(user, payload.sessionId),
    expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS,
    sessionId: payload.sessionId
  };
}

export async function logoutUser(redis: RedisClientType, sessionId: string) {
  const session = await redis.get(sessionKey(sessionId));
  if (session) {
    const parsedSession = JSON.parse(session) as SessionRecord;
    await redis.sRem(userSessionsKey(parsedSession.userId), sessionId);
  }

  await redis.del(sessionKey(sessionId));

  return { loggedOut: true };
}

export async function requestPasswordReset(redis: RedisClientType, email: string) {
  const user = getUserByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  const resetToken = await issuePasswordResetToken(redis, user);
  return {
    passwordResetRequired: true,
    resetToken: process.env.NODE_ENV === 'production' ? undefined : resetToken,
    resetTokenExpiresInSeconds: PASSWORD_RESET_TTL_SECONDS
  };
}

export async function resetPassword(redis: RedisClientType, input: { token: string; newPassword: string }) {
  const userId = await redis.get(passwordResetKey(input.token));
  if (!userId) {
    throw new Error('Invalid or expired password reset token');
  }

  const user = getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.passwordHash = await bcrypt.hash(input.newPassword, 12);
  await invalidateAllSessions(redis, user.id);
  await redis.del(passwordResetKey(input.token));

  return { passwordUpdated: true };
}

export async function changePassword(redis: RedisClientType, input: { email: string; currentPassword: string; newPassword: string }) {
  const user = getUserByEmail(input.email);
  if (!user) {
    throw new Error('User not found');
  }

  const passwordMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!passwordMatches) {
    throw new Error('Invalid credentials');
  }

  user.passwordHash = await bcrypt.hash(input.newPassword, 12);
  await invalidateAllSessions(redis, user.id);

  return { passwordChanged: true };
}

export async function getCurrentUser(redis: RedisClientType, input: { accessToken: string }) {
  const payload = jwt.verify(input.accessToken, JWT_SECRET) as jwt.JwtPayload & {
    sub?: string;
    sessionId?: string;
  };

  if (!payload.sub || !payload.sessionId) {
    throw new Error('Invalid access token');
  }

  const session = await redis.get(sessionKey(payload.sessionId));
  if (!session) {
    throw new Error('Session expired or revoked');
  }

  const user = getUserById(payload.sub);
  if (!user) {
    throw new Error('User not found');
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      roles: user.roles,
      createdAt: user.createdAt
    }
  };
}
