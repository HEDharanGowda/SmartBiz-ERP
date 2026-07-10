# Auth Service Info

## Purpose

The Auth Service owns identity and session control for the platform. It is the first domain service to become functional because every other service depends on authenticated users and valid sessions.

## Current Code

- `src/index.ts` exposes the auth API surface.
- `src/authStore.ts` contains the current auth/session logic.
- Redis is used for session and token storage.
- The service is connected to the API Gateway through proxy forwarding.

## Dependencies

- `redis` for session storage and token TTL handling
- `bcryptjs` for password hashing
- `jsonwebtoken` for JWT access and refresh token generation
- `dotenv` for environment configuration loading
- `@smartbiz/service-kit` for the shared app bootstrap

## What the Current Code Handles

- User registration scaffold
- Email verification token generation
- Login scaffold
- Refresh token scaffold
- Logout scaffold
- Redis session storage helpers

## Intended Architecture

- Password hashes should use bcrypt with at least 12 rounds.
- Access tokens should expire in 15 minutes.
- Refresh tokens should expire in 7 days.
- Sessions should be stored in Redis and invalidated on logout or password change.
- OTP should be used when multi-factor authentication is enabled.

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

## What It Will Do Next

- Replace scaffolds with real user persistence.
- Send email verification and password reset notifications.
- Persist refresh-token and session metadata safely.
- Add account lockout after repeated failed logins.
- Publish auth-related events if needed by notification or audit flows.

## Update Rule

Update this file whenever auth flows, Redis keys, security rules, or token/session behavior change.