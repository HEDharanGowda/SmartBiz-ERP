# API Gateway Service Info

## Purpose

The API Gateway is the entry point for the SmartBiz ERP backend. It will route browser and client requests to the correct microservice and later enforce gateway-level concerns such as auth checks, rate limiting, request forwarding, and versioned APIs.

## Current Code

- `src/index.ts` creates an Express app using the shared service kit.
- `/api/v1/routes` returns the service routing table.
- `/api/v1/auth` is proxied to the auth service at `http://localhost:3001`.
- Health and readiness endpoints come from `packages/service-kit`.

## Dependencies

- `@smartbiz/service-kit` for common Express setup
- `http-proxy-middleware` for forwarding auth traffic
- Root dependencies such as `express`, `cors`, `helmet`, and `morgan`

## Architecture Role

- Acts as the single backend entry point for the frontend.
- Central place for future authentication enforcement and request routing.
- Keeps browser clients from calling internal services directly.

## Current Routes

- `GET /api/v1/routes`
- `ANY /api/v1/auth/*` via proxy to auth service
- `GET /health`
- `GET /ready`

## What It Will Do Next

- Proxy the remaining service routes.
- Validate access tokens before forwarding protected requests.
- Add rate limiting and request timeout handling.
- Expose OpenAPI and versioned API routing.

## Update Rule

Update this file whenever a route, proxy target, gateway policy, or dependency changes.