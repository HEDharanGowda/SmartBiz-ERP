import 'dotenv/config';
import type { Request, Response } from 'express';
import { createClient } from 'redis';
import { createServiceApp } from '@smartbiz/service-kit';
import {
  changePassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  verifyOtp
} from './authStore.js';

const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' });

redis.on('error', (error) => {
  console.error('auth-service redis error:', error);
});

const app = createServiceApp({ name: 'auth-service', port: 3001 });

app.post('/api/v1/auth/register', async (request: Request, response: Response) => {
  try {
    response.status(201).json(await registerUser(redis, request.body));
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Unable to register user' });
  }
});

app.post('/api/v1/auth/verify-email', async (request: Request, response: Response) => {
  try {
    response.json(await verifyEmail(redis, request.body.token));
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Unable to verify email' });
  }
});

app.post('/api/v1/auth/login', async (request: Request, response: Response) => {
  try {
    response.json(await loginUser(redis, request.body));
  } catch (error) {
    response.status(401).json({ message: error instanceof Error ? error.message : 'Invalid login' });
  }
});

app.post('/api/v1/auth/verify-otp', async (request: Request, response: Response) => {
  try {
    response.json(await verifyOtp(redis, request.body));
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Unable to verify OTP' });
  }
});

app.post('/api/v1/auth/refresh', async (request: Request, response: Response) => {
  try {
    response.json(await refreshAccessToken(redis, request.body));
  } catch (error) {
    response.status(401).json({ message: error instanceof Error ? error.message : 'Unable to refresh access token' });
  }
});

app.post('/api/v1/auth/logout', async (request: Request, response: Response) => {
  try {
    response.json(await logoutUser(redis, request.body.sessionId));
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Unable to logout' });
  }
});

app.post('/api/v1/auth/request-password-reset', async (request: Request, response: Response) => {
  try {
    response.json(await requestPasswordReset(redis, request.body.email));
  } catch (error) {
    response.status(404).json({ message: error instanceof Error ? error.message : 'Unable to request password reset' });
  }
});

app.post('/api/v1/auth/reset-password', async (request: Request, response: Response) => {
  try {
    response.json(await resetPassword(redis, request.body));
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Unable to reset password' });
  }
});

app.post('/api/v1/auth/change-password', async (request: Request, response: Response) => {
  try {
    response.json(await changePassword(redis, request.body));
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Unable to change password' });
  }
});

app.get('/api/v1/auth/me', async (request: Request, response: Response) => {
  try {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      response.status(401).json({ message: 'Missing bearer token' });
      return;
    }

    response.json(await getCurrentUser(redis, { accessToken: authorization.slice('Bearer '.length) }));
  } catch (error) {
    response.status(401).json({ message: error instanceof Error ? error.message : 'Unable to read current user' });
  }
});

async function start() {
  if (!redis.isOpen) {
    await redis.connect();
  }

  app.listen(3001, () => {
    console.log('auth-service listening on port 3001');
  });
}

start().catch((error) => {
  console.error('auth-service failed to start:', error);
  process.exit(1);
import crypto from 'node:crypto';
import { createServiceApp, getRedisClient } from '@smartbiz/service-kit';

const app = createServiceApp({ name: 'auth-service', port: 3001 });

type AuthSession = {
  userId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
};

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function createToken(prefix: string) {
  return `${prefix}_${crypto.randomBytes(24).toString('hex')}`;
}

function createSession(userId: string, email: string): AuthSession {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString();

  return {
    userId,
    email,
    createdAt: now.toISOString(),
    expiresAt
  };
}

async function storeSession(accessToken: string, session: AuthSession) {
  const redis = await getRedisClient();
  await redis.set(`auth:session:${accessToken}`, JSON.stringify(session), {
    EX: ACCESS_TOKEN_TTL_SECONDS
  });
}

async function storeRefreshToken(refreshToken: string, userId: string) {
  const redis = await getRedisClient();
  await redis.set(`auth:refresh:${refreshToken}`, userId, {
    EX: REFRESH_TOKEN_TTL_SECONDS
  });
}

app.post('/api/v1/auth/register', async (_request, response) => {
  const userId = crypto.randomUUID();
  const emailVerificationToken = createToken('verify');

  response.status(201).json({
    message: 'User registration scaffold created.',
    userId,
    emailVerificationToken,
    emailVerificationExpiresInSeconds: 60 * 60
  });
});

app.post('/api/v1/auth/login', async (_request, response) => {
  const userId = crypto.randomUUID();
  const email = 'demo@smartbiz.local';
  const accessToken = createToken('access');
  const refreshToken = createToken('refresh');
  const session = createSession(userId, email);

  await storeSession(accessToken, session);
  await storeRefreshToken(refreshToken, userId);

  response.json({
    message: 'Login scaffold completed.',
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    accessTokenExpiresInSeconds: ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresInSeconds: REFRESH_TOKEN_TTL_SECONDS,
    session
  });
});

app.post('/api/v1/auth/refresh', async (_request, response) => {
  const newAccessToken = createToken('access');
  const userId = crypto.randomUUID();
  const email = 'demo@smartbiz.local';
  const session = createSession(userId, email);

  await storeSession(newAccessToken, session);

  response.json({
    message: 'Refresh scaffold completed.',
    accessToken: newAccessToken,
    accessTokenExpiresInSeconds: ACCESS_TOKEN_TTL_SECONDS
  });
});

app.post('/api/v1/auth/logout', async (_request, response) => {
  response.json({
    message: 'Logout scaffold completed. Session invalidation will delete the Redis session key.'
  });
});

app.listen(3001, () => {
  console.log('auth-service listening on port 3001');
});