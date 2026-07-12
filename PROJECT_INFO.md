# SmartBiz ERP Project Info

## Current State

SmartBiz ERP is currently a buildable monorepo scaffold for a Node.js and React microservices platform. The repo has the correct service boundaries, shared backend utilities, a React frontend shell, and local infrastructure definitions, but most business features are still placeholder implementations.

The workspace build passes end to end.

## Architecture Summary

The project follows the architecture described in `requirements.md` and the attached Word document:

- Node.js for all backend services
- React for the frontend application
- PostgreSQL for transactional and ACID-heavy data
- MongoDB for flexible document data
- Redis for sessions and caching
- Kafka for event streaming
- RabbitMQ for task queues and background jobs

## Repository Structure

### Root

- `package.json`: Monorepo workspace configuration and root scripts
- `docker-compose.yml`: Local infrastructure for PostgreSQL, MongoDB, Redis, Kafka, and RabbitMQ
- `tsconfig.base.json`: Shared TypeScript compiler settings
- `README.md`: High-level architecture summary
- `PROJECT_INFO.md`: This file

### `apps/web`

Frontend React application.

- `package.json`: Vite React app metadata and scripts
- `index.html`: Frontend entry HTML
- `vite.config.ts`: Vite configuration
- `tsconfig.json`: Frontend TypeScript config
- `src/main.tsx`: React bootstrap
- `src/App.tsx`: Auth console UI for register, login, MFA, password reset, refresh, logout, and profile lookup
- `src/styles.css`: Styling for the auth console

### `packages/shared`

Shared types used across the workspace.

- `package.json`: Shared package metadata
- `src/index.ts`: Shared package export entry
- `src/types.ts`: Common types like service names and health response shape

### `packages/service-kit`

Common backend service bootstrap utilities.

- `package.json`: Service kit metadata
- `src/index.ts`: Service kit export entry
- `src/serviceConfig.ts`: Shared service config type
- `src/createServiceApp.ts`: Express app factory with security middleware and health/ready endpoints

### `services/*`

Each folder under `services/` is a separate backend microservice.

- `api-gateway`: Entry point for routing and gateway behavior
- `auth-service`: Authentication, tokens, sessions, verification, OTP
- `organization-service`: Company, departments, and role management
- `employee-service`: Employee lifecycle, documents, manager relationships
- `attendance-service`: Check-in/out, leave, holidays, late tracking
- `payroll-service`: Salary calculation, tax, payslips, salary history
- `inventory-service`: Products, stock, warehouses, vendors, stock movements
- `sales-service`: Customers, invoices, payments, GST, revenue
- `finance-service`: Income, expenses, profit, cash flow, reports
- `notification-service`: Email and in-app notifications
- `dashboard-service`: Aggregated business metrics and executive views

Each service currently contains:

- `package.json`
- `tsconfig.json`
- `src/index.ts`

The service files are currently scaffolded with placeholder endpoints and health checks.

## What Code Exists Today

### Backend foundation

- Shared Express setup in `packages/service-kit/src/createServiceApp.ts`
- Standard `/health` and `/ready` endpoints for services
- Security middleware: `helmet`, `cors`, JSON parsing, and request logging
- Redis client helper in `packages/service-kit/src/redisClient.ts`
- Auth service now uses MongoDB for user and token documents plus Redis for sessions and OTP challenges
- API gateway proxying `/api/v1/auth` to the auth service

### Frontend foundation

- A React auth console that exercises the auth service flows
- Responsive styling and in-memory session state only, with no browser local storage

### Infrastructure foundation

- Docker Compose definitions for the supporting datastores and brokers
- TypeScript workspace config for consistent compilation
- NPM workspaces for monorepo management

## What Is Not Implemented Yet

- Real database schemas and migrations for the remaining services
- Email delivery for verification and password reset messages
- Gateway routing rules, auth guards, and rate limiting
- Domain event publishing and consumers for Kafka and RabbitMQ
- Redis session management and cache invalidation
- Real CRUD APIs for each microservice
- Persistence logic for PostgreSQL and MongoDB
- Frontend business screens and dashboards beyond the auth console
- API documentation and OpenAPI generation

## Validation Status

- Workspace install completed successfully
- Workspace build passes successfully

## Recommended Next Steps

1. Wire real email delivery for verification and password reset messages.
2. Add shared environment loading so Redis, PostgreSQL, MongoDB, Kafka, and RabbitMQ URLs come from config.
3. Add gateway guards and route forwarding for the rest of the services.
4. Implement PostgreSQL and MongoDB access layers per service.
5. Wire Kafka consumers/producers for business events.
6. Wire RabbitMQ jobs for retryable background work like email delivery.
7. Build the real ERP dashboard and module screens after auth.
8. Add Dockerfiles and run commands for each service.

## Notes

This project is intentionally scaffolded to match the requirements and the document guidance. It is ready for feature-by-feature implementation without changing the overall architecture.