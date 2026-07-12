import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';

const JWT_SECRET = process.env.JWT_SECRET ?? 'smartbiz-dev-secret';

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
    roles: string[];
    sessionId: string;
  };
};

function sessionKey(sessionId: string) {
  return `smartbiz:auth:session:${sessionId}`;
}

export async function authenticateToken(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    response.status(401).json({ message: 'Missing bearer token' });
    return;
  }

  try {
    const token = authorization.slice('Bearer '.length);
    const payload = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      email: string;
      sessionId: string;
      roles: string[];
    };

    const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' });
    if (!redis.isOpen) {
      await redis.connect();
    }

    const session = await redis.get(sessionKey(payload.sessionId));
    await redis.quit();

    if (!session) {
      response.status(401).json({ message: 'Session expired or revoked' });
      return;
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
      sessionId: payload.sessionId
    };

    next();
  } catch (error) {
    response.status(401).json({ message: 'Invalid token' });
  }
}

export function authorizeRoles(...allowedRoles: string[]) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (!request.user) {
      response.status(401).json({ message: 'Authentication required' });
      return;
    }

    const hasRole = request.user.roles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      response.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
