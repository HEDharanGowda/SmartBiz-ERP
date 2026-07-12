# Auth Service Info

## Purpose

The Auth Service is the identity boundary for SmartBiz ERP. It owns registration, verification, login, token issuance, session control, password reset, password change, and MFA verification.

## Current Architecture

- Node.js service running on port `3001`
- Express app created through `packages/service-kit`
- MongoDB for durable user and token data
- Redis for short-lived sessions and OTP challenges
- JWT for access and refresh tokens
- bcrypt with 12 rounds for password hashing

## Dependencies

- `mongodb` for the auth schema and persistence
- `redis` for session storage and OTP state
- `bcryptjs` for password hashing and password verification
- `jsonwebtoken` for access and refresh token generation
- `dotenv` for environment configuration
- `@smartbiz/service-kit` for common app bootstrap and health endpoints

## MongoDB Schema

The service currently uses these collections:

- `auth_users`
- `auth_email_verifications`
- `auth_password_resets`

### `auth_users`

Stores the durable user account document.

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

### `auth_email_verifications`

Stores email verification tokens with TTL expiry.

### `auth_password_resets`

Stores password reset tokens with TTL expiry.

## Redis Keys

Redis is used for runtime session and OTP state.

- `smartbiz:auth:session:*` for access/session payloads
- `smartbiz:auth:user-sessions:*` for per-user session sets
- `smartbiz:auth:otp:*` for MFA challenges

## Current API Surface

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/request-password-reset`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/change-password`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/schema`

## What the Current Code Does

- Registers users in MongoDB with bcrypt password hashes.
- Generates and stores email verification tokens with MongoDB TTL indexes.
- Blocks login for unverified users.
- Supports MFA by generating a 6-digit OTP challenge in Redis.
- Issues JWT access and refresh tokens after successful auth.
- Stores active sessions in Redis.
- Supports refresh-token exchange.
- Supports logout and session invalidation.
- Supports password reset and password change flows.
- Enforces account lockout after repeated failed login attempts.

## Important Behavior

- Access tokens expire after 15 minutes.
- Refresh tokens expire after 7 days.
- OTP challenges expire after 5 minutes.
- Password reset and email verification tokens expire after 1 hour.
- Password hashes use bcrypt with minimum 12 rounds.
- Sessions are invalidated on password reset and password change.

## Frontend Integration

The React app now includes an auth console that calls the gateway and exercises the auth service flows:

- Register
- Email verification
- Login
- OTP verification
- Refresh token
- Logout
- Password reset
- Change password
- Read current user profile

## What It Will Do Next

- Send real email verification and password reset messages.
- Add audit/event publishing where needed.
- Replace in-memory development output with proper mail delivery.
- Add more defensive request validation and rate limiting.

## Update Rule

Update this file whenever auth flows, collections, Redis key patterns, security rules, or token lifetimes change.
