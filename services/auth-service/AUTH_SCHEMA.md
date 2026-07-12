# Auth Schema

## Database

- MongoDB database name: `smartbiz_erp`
- Override with `MONGODB_DB`

## Environment Variables

- `MONGODB_URL`: MongoDB connection string, default `mongodb://localhost:27017`
- `MONGODB_DB`: MongoDB database name, default `smartbiz_erp`
- `REDIS_URL`: Redis connection string, default `redis://localhost:6379`
- `JWT_SECRET`: JWT signing secret, default `smartbiz-dev-secret` for local development

## MongoDB Collections

- `auth_users`
- `auth_email_verifications`
- `auth_password_resets`

## Redis Keys

- `smartbiz:auth:session:*`
- `smartbiz:auth:user-sessions:*`
- `smartbiz:auth:otp:*`

## Main User Document Shape

`auth_users` stores the durable account record.

Important fields:

- `id`
- `email`
- `passwordHash`
- `emailVerified`
- `mfaEnabled`
- `roles`
- `createdAt`
- `updatedAt`
- `lastLoginAt`
- `failedLoginAttempts`
- `lockoutUntil`

## Token Collections

### `auth_email_verifications`

Fields:

- `token`
- `userId`
- `email`
- `createdAt`
- `expiresAt`
- `usedAt`

### `auth_password_resets`

Fields:

- `token`
- `userId`
- `email`
- `createdAt`
- `expiresAt`
- `usedAt`

## Runtime Schema Endpoint

You can also fetch the schema from the service itself:

- `GET /api/v1/auth/schema`

That endpoint returns the active database name, collection names, Redis key patterns, and token TTL values.
