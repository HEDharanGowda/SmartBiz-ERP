import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Collection, Db } from 'mongodb';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const OTP_TTL_SECONDS = 5 * 60;
const PASSWORD_RESET_TTL_SECONDS = 60 * 60;
const EMAIL_VERIFICATION_TTL_SECONDS = 60 * 60;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

const JWT_SECRET = process.env.JWT_SECRET ?? 'smartbiz-dev-secret';

export type AuthUser = {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  failedLoginAttempts: number;
  lockoutUntil?: string;
};

export type AuthSession = {
  sessionId: string;
  userId: string;
  email: string;
  roles: string[];
  createdAt: string;
  expiresAt: string;
};

type AuthResult = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresInSeconds: number;
};

type VerificationToken = {
  token: string;
  userId: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date | null;
};

type PasswordResetToken = {
  token: string;
  userId: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date | null;
};

type OtpChallenge = {
  challengeId: string;
  userId: string;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
};

export type AuthCollections = {
  users: Collection<AuthUser>;
  emailVerifications: Collection<VerificationToken>;
  passwordResets: Collection<PasswordResetToken>;
};

export type AuthRedisClient = {
  set(...args: any[]): Promise<any>;
  get(...args: any[]): Promise<any>;
  del(...args: any[]): Promise<any>;
  sAdd(...args: any[]): Promise<any>;
  sMembers(...args: any[]): Promise<any>;
  sRem(...args: any[]): Promise<any>;
  expire(...args: any[]): Promise<any>;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function sessionKey(sessionId: string) {
  return `smartbiz:auth:session:${sessionId}`;
}

function userSessionsKey(userId: string) {
  return `smartbiz:auth:user-sessions:${userId}`;
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

export function getAuthCollections(db: Db): AuthCollections {
  return {
    users: db.collection<AuthUser>('auth_users'),
    emailVerifications: db.collection<VerificationToken>('auth_email_verifications'),
    passwordResets: db.collection<PasswordResetToken>('auth_password_resets')
  };
}

export async function ensureAuthIndexes(db: Db) {
  const collections = getAuthCollections(db);

  await Promise.all([
    collections.users.createIndex({ email: 1 }, { unique: true }),
    collections.users.createIndex({ lockoutUntil: 1 }),
    collections.emailVerifications.createIndex({ token: 1 }, { unique: true }),
    collections.emailVerifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    collections.passwordResets.createIndex({ token: 1 }, { unique: true }),
    collections.passwordResets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  ]);
}

async function storeSession(redis: AuthRedisClient, session: AuthSession) {
  await redis.set(sessionKey(session.sessionId), JSON.stringify(session), {
    EX: ACCESS_TOKEN_TTL_SECONDS
  });
  await redis.sAdd(userSessionsKey(session.userId), session.sessionId);
  await redis.expire(userSessionsKey(session.userId), REFRESH_TOKEN_TTL_SECONDS);
}

async function createAuthResult(redis: AuthRedisClient, user: AuthUser): Promise<AuthResult> {
  const sessionId = randomUUID();
  const now = new Date().toISOString();
  const session: AuthSession = {
    sessionId,
    userId: user.id,
    email: user.email,
    roles: user.roles,
    createdAt: now,
    expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString()
  };

  const accessToken = signAccessToken(user, sessionId);
  const refreshToken = signRefreshToken(user, sessionId);

  await storeSession(redis, session);

  return {
    accessToken,
    refreshToken,
    sessionId,
    expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS
  };
}

async function getUserSessions(redis: AuthRedisClient, userId: string) {
  return redis.sMembers(userSessionsKey(userId));
}

async function invalidateAllSessions(redis: AuthRedisClient, userId: string) {
  const sessionIds = await getUserSessions(redis, userId);
  if (sessionIds.length) {
    await Promise.all(sessionIds.map((sessionId: string) => redis.del(sessionKey(sessionId))));
  }
  await redis.del(userSessionsKey(userId));
}

async function issueEmailVerificationToken(collections: AuthCollections, user: AuthUser) {
  const token = randomUUID();
  await collections.emailVerifications.insertOne({
    token,
    userId: user.id,
    email: user.email,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_SECONDS * 1000),
    usedAt: null
  });

  return token;
}

async function issuePasswordResetToken(collections: AuthCollections, user: AuthUser) {
  const token = randomUUID();
  await collections.passwordResets.insertOne({
    token,
    userId: user.id,
    email: user.email,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_SECONDS * 1000),
    usedAt: null
  });

  return token;
}

async function issueOtpChallenge(redis: AuthRedisClient, user: AuthUser) {
  const challengeId = randomUUID();
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const challenge: OtpChallenge = {
    challengeId,
    userId: user.id,
    otp,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000)
  };

  await redis.set(otpChallengeKey(challengeId), JSON.stringify(challenge), {
    EX: OTP_TTL_SECONDS
  });

  return { challengeId, otp };
}

function sanitizeUser(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    mfaEnabled: user.mfaEnabled,
    roles: user.roles,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
    failedLoginAttempts: user.failedLoginAttempts,
    lockoutUntil: user.lockoutUntil
  };
}

async function findUserByEmail(collections: AuthCollections, email: string) {
  return collections.users.findOne({ email: normalizeEmail(email) });
}

async function findUserById(collections: AuthCollections, userId: string) {
  return collections.users.findOne({ id: userId });
}

async function incrementFailedAttempts(collections: AuthCollections, user: AuthUser) {
  const nextAttempts = user.failedLoginAttempts + 1;
  const shouldLock = nextAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;
  const lockoutUntil = shouldLock ? new Date(Date.now() + LOCKOUT_WINDOW_MINUTES * 60 * 1000).toISOString() : user.lockoutUntil;

  await collections.users.updateOne(
    { id: user.id },
    {
      $set: {
        failedLoginAttempts: nextAttempts,
        lockoutUntil,
        updatedAt: new Date().toISOString()
      }
    }
  );
}

async function resetFailedAttempts(collections: AuthCollections, user: AuthUser) {
  await collections.users.updateOne(
    { id: user.id },
    {
      $set: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      $unset: {
        lockoutUntil: ''
      }
    }
  );
}

export async function registerUser(collections: AuthCollections, redis: AuthRedisClient, input: {
  email: string;
  password: string;
  roles?: string[];
  mfaEnabled?: boolean;
}) {
  const email = normalizeEmail(input.email);
  const existingUser = await findUserByEmail(collections, email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const now = new Date().toISOString();
  const user: AuthUser = {
    id: randomUUID(),
    email,
    passwordHash: await bcrypt.hash(input.password, 12),
    emailVerified: false,
    mfaEnabled: Boolean(input.mfaEnabled),
    roles: input.roles?.length ? input.roles : ['Employee'],
    createdAt: now,
    updatedAt: now,
    failedLoginAttempts: 0,
    lockoutUntil: undefined,
    lastLoginAt: undefined
  };

  await collections.users.insertOne(user);
  const verificationToken = await issueEmailVerificationToken(collections, user);

  return {
    user: sanitizeUser(user),
    emailVerificationRequired: true,
    verificationToken: process.env.NODE_ENV === 'production' ? undefined : verificationToken
  };
}

export async function verifyEmail(collections: AuthCollections, token: string) {
  const verification = await collections.emailVerifications.findOne({ token });
  if (!verification || verification.usedAt) {
    throw new Error('Invalid or expired verification token');
  }

  const user = await findUserById(collections, verification.userId);
  if (!user) {
    throw new Error('User not found');
  }

  await collections.users.updateOne(
    { id: user.id },
    {
      $set: {
        emailVerified: true,
        updatedAt: new Date().toISOString()
      }
    }
  );

  await collections.emailVerifications.updateOne(
    { token },
    {
      $set: { usedAt: new Date() }
    }
  );

  const updatedUser = await findUserById(collections, user.id);
  if (!updatedUser) {
    throw new Error('User not found after verification');
  }

  return { user: sanitizeUser(updatedUser) };
}

export async function loginUser(collections: AuthCollections, redis: AuthRedisClient, input: { email: string; password: string }) {
  const user = await findUserByEmail(collections, input.email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (user.lockoutUntil && new Date(user.lockoutUntil).getTime() > Date.now()) {
    throw new Error('Account temporarily locked');
  }

  if (!user.emailVerified) {
    throw new Error('Email is not verified');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    await incrementFailedAttempts(collections, user);
    throw new Error('Invalid credentials');
  }

  await resetFailedAttempts(collections, user);
  const refreshedUser = await findUserById(collections, user.id);
  if (!refreshedUser) {
    throw new Error('User not found');
  }

  if (refreshedUser.mfaEnabled) {
    const challenge = await issueOtpChallenge(redis, refreshedUser);
    return {
      mfaRequired: true,
      challengeId: challenge.challengeId,
      otp: process.env.NODE_ENV === 'production' ? undefined : challenge.otp,
      otpExpiresInSeconds: OTP_TTL_SECONDS
    };
  }

  return createAuthResult(redis, refreshedUser);
}

export async function verifyOtp(collections: AuthCollections, redis: AuthRedisClient, input: { challengeId: string; otp: string }) {
  const rawChallenge = await redis.get(otpChallengeKey(input.challengeId));
  if (!rawChallenge) {
    throw new Error('OTP challenge expired');
  }

  const challenge = JSON.parse(rawChallenge) as OtpChallenge;
  if (challenge.otp !== input.otp) {
    throw new Error('Invalid OTP');
  }

  const user = await findUserById(collections, challenge.userId);
  if (!user) {
    throw new Error('User not found');
  }

  await redis.del(otpChallengeKey(input.challengeId));
  return createAuthResult(redis, user);
}

export async function refreshAccessToken(collections: AuthCollections, redis: AuthRedisClient, input: { refreshToken: string }) {
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

  const parsedSession = JSON.parse(session) as AuthSession;
  const user = await findUserById(collections, parsedSession.userId);

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

export async function logoutUser(redis: AuthRedisClient, sessionId: string) {
  const session = await redis.get(sessionKey(sessionId));
  if (session) {
    const parsedSession = JSON.parse(session) as AuthSession;
    await redis.sRem(userSessionsKey(parsedSession.userId), sessionId);
  }

  await redis.del(sessionKey(sessionId));
  return { loggedOut: true };
}

export async function requestPasswordReset(collections: AuthCollections, email: string) {
  const user = await findUserByEmail(collections, email);
  if (!user) {
    throw new Error('User not found');
  }

  const resetToken = await issuePasswordResetToken(collections, user);
  return {
    passwordResetRequired: true,
    resetToken: process.env.NODE_ENV === 'production' ? undefined : resetToken,
    resetTokenExpiresInSeconds: PASSWORD_RESET_TTL_SECONDS
  };
}

export async function resetPassword(collections: AuthCollections, redis: AuthRedisClient, input: { token: string; newPassword: string }) {
  const tokenRecord = await collections.passwordResets.findOne({ token: input.token });
  if (!tokenRecord || tokenRecord.usedAt) {
    throw new Error('Invalid or expired password reset token');
  }

  const user = await findUserById(collections, tokenRecord.userId);
  if (!user) {
    throw new Error('User not found');
  }

  await collections.users.updateOne(
    { id: user.id },
    {
      $set: {
        passwordHash: await bcrypt.hash(input.newPassword, 12),
        updatedAt: new Date().toISOString(),
        failedLoginAttempts: 0
      },
      $unset: {
        lockoutUntil: ''
      }
    }
  );

  await collections.passwordResets.updateOne(
    { token: input.token },
    {
      $set: { usedAt: new Date() }
    }
  );

  await invalidateAllSessions(redis, user.id);
  return { passwordUpdated: true };
}

export async function changePassword(collections: AuthCollections, redis: AuthRedisClient, input: { email: string; currentPassword: string; newPassword: string }) {
  const user = await findUserByEmail(collections, input.email);
  if (!user) {
    throw new Error('User not found');
  }

  const passwordMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!passwordMatches) {
    throw new Error('Invalid credentials');
  }

  await collections.users.updateOne(
    { id: user.id },
    {
      $set: {
        passwordHash: await bcrypt.hash(input.newPassword, 12),
        updatedAt: new Date().toISOString(),
        failedLoginAttempts: 0
      },
      $unset: {
        lockoutUntil: ''
      }
    }
  );

  await invalidateAllSessions(redis, user.id);
  return { passwordChanged: true };
}

export async function getCurrentUser(collections: AuthCollections, redis: AuthRedisClient, input: { accessToken: string }) {
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

  const user = await findUserById(collections, payload.sub);
  if (!user) {
    throw new Error('User not found');
  }

  return {
    user: sanitizeUser(user)
  };
}