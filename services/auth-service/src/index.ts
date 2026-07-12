import 'dotenv/config';
import type { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import { createServiceApp } from '@smartbiz/service-kit';
import {
  changePassword,
  ensureAuthIndexes,
  getAuthCollections,
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

const mongoClient = new MongoClient(process.env.MONGODB_URL ?? 'mongodb://localhost:27017');
const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' });
const databaseName = process.env.MONGODB_DB ?? 'smartbiz_erp';

redis.on('error', (error) => {
  console.error('auth-service redis error:', error);
});

const app = createServiceApp({ name: 'auth-service', port: 3001 });

app.post('/api/v1/auth/register', async (request: Request, response: Response) => {
  try {
    const collections = getAuthCollections(mongoClient.db(databaseName));
    response.status(201).json(await registerUser(collections, redis, request.body));
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Unable to register user' });
  }
});

app.post('/api/v1/auth/verify-email', async (request: Request, response: Response) => {
  try {
    const collections = getAuthCollections(mongoClient.db(databaseName));
    response.json(await verifyEmail(collections, request.body.token));
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Unable to verify email' });
  }
});

app.post('/api/v1/auth/login', async (request: Request, response: Response) => {
  try {
    const collections = getAuthCollections(mongoClient.db(databaseName));
    response.json(await loginUser(collections, redis, request.body));
  } catch (error) {
    response.status(401).json({ message: error instanceof Error ? error.message : 'Invalid login' });
  }
});

app.post('/api/v1/auth/verify-otp', async (request: Request, response: Response) => {
  try {
    const collections = getAuthCollections(mongoClient.db(databaseName));
    response.json(await verifyOtp(collections, redis, request.body));
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Unable to verify OTP' });
  }
});

app.post('/api/v1/auth/refresh', async (request: Request, response: Response) => {
  try {
    const collections = getAuthCollections(mongoClient.db(databaseName));
    response.json(await refreshAccessToken(collections, redis, request.body));
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
    const collections = getAuthCollections(mongoClient.db(databaseName));
    response.json(await requestPasswordReset(collections, request.body.email));
  } catch (error) {
    response.status(404).json({ message: error instanceof Error ? error.message : 'Unable to request password reset' });
  }
});

app.post('/api/v1/auth/reset-password', async (request: Request, response: Response) => {
  try {
    const collections = getAuthCollections(mongoClient.db(databaseName));
    response.json(await resetPassword(collections, redis, request.body));
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Unable to reset password' });
  }
});

app.post('/api/v1/auth/change-password', async (request: Request, response: Response) => {
  try {
    const collections = getAuthCollections(mongoClient.db(databaseName));
    response.json(await changePassword(collections, redis, request.body));
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Unable to change password' });
  }
});

app.get('/api/v1/auth/schema', (_request: Request, response: Response) => {
  response.json({
    database: databaseName,
    collections: {
      users: 'auth_users',
      emailVerifications: 'auth_email_verifications',
      passwordResets: 'auth_password_resets'
    },
    redisKeys: {
      sessions: 'smartbiz:auth:session:*',
      userSessions: 'smartbiz:auth:user-sessions:*',
      otpChallenges: 'smartbiz:auth:otp:*'
    },
    tokenTtls: {
      accessTokenSeconds: 900,
      refreshTokenSeconds: 604800,
      otpSeconds: 300,
      passwordResetSeconds: 3600,
      emailVerificationSeconds: 3600
    }
  });
});

app.get('/api/v1/auth/me', async (request: Request, response: Response) => {
  try {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      response.status(401).json({ message: 'Missing bearer token' });
      return;
    }

    const collections = getAuthCollections(mongoClient.db(databaseName));
    response.json(await getCurrentUser(collections, redis, { accessToken: authorization.slice('Bearer '.length) }));
  } catch (error) {
    response.status(401).json({ message: error instanceof Error ? error.message : 'Unable to read current user' });
  }
});

async function start() {
  await mongoClient.connect();
  if (!redis.isOpen) {
    await redis.connect();
  }

  await ensureAuthIndexes(mongoClient.db(databaseName));

  app.listen(3001, () => {
    console.log('auth-service listening on port 3001');
  });
}

start().catch((error) => {
  console.error('auth-service failed to start:', error);
  process.exit(1);
});