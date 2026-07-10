# Docker Compose Info for SmartBiz ERP

This file explains the containers started by `docker-compose.yml`, what each one is for, and where it is used in the current SmartBiz ERP architecture.

## What Docker Compose Does Here

`docker-compose.yml` starts the supporting infrastructure that the backend services will use during local development:

- PostgreSQL for transactional and relational data
- MongoDB for document-style and flexible-schema data
- Redis for sessions and caching
- Kafka for event streaming
- RabbitMQ for task queues and background jobs

This means you do not run these databases and brokers manually one by one. Docker Compose brings them up together as the local platform for the ERP backend.

## Containers Started

### `postgres`

- Image: `postgres:16-alpine`
- Ports: `5432:5432`
- Data volume: `postgres_data`
- Purpose: stores relational data that needs ACID guarantees and strong integrity

Used by:

- Payroll Service
- Sales Service
- Finance Service
- Inventory Service
- Attendance Service
- Any future service that needs transactional records

Why it exists:

- Payroll calculations, invoice creation, finance reports, and stock movement tracking all need reliable transactions and relational constraints.

### `mongodb`

- Image: `mongo:7`
- Ports: `27017:27017`
- Data volume: `mongo_data`
- Purpose: stores flexible document data

Used by:

- Auth Service for flexible auth/session-related records if needed
- Organization Service for company and department documents
- Employee Service for employee profiles and uploaded documents
- Notification Service for in-app notification data
- Audit and configuration-style records where schema may change

Why it exists:

- The requirements call for document-oriented storage where schema flexibility is more useful than rigid relational tables.

### `redis`

- Image: `redis:7-alpine`
- Ports: `6379:6379`
- Purpose: fast in-memory cache and session store

Used by:

- Auth Service for active sessions
- Dashboard Service for cached dashboard metrics
- Finance Service for cached reports
- API Gateway for fast request/session checks later

Why it exists:

- The requirements explicitly call for session storage, cached metrics, and low-latency reads.

### `zookeeper`

- Image: `confluentinc/cp-zookeeper:7.6.1`
- Ports: `2181:2181`
- Purpose: coordination service required by Kafka in this setup

Used by:

- Kafka only

Why it exists:

- Kafka needs coordination metadata in this compose setup, and Zookeeper provides that role here.

### `kafka`

- Image: `confluentinc/cp-kafka:7.6.1`
- Ports: `9092:9092`
- Depends on: `zookeeper`
- Purpose: event streaming and publish-subscribe communication

Used by:

- Auth Service for auth-related events later
- Organization Service for role events
- Employee Service for lifecycle events
- Payroll Service for payroll processed events
- Inventory Service for low stock alerts
- Sales Service for invoice and payment events
- Notification Service to consume events and send messages
- Dashboard Service to refresh cached metrics from domain events

Why it exists:

- The requirements specify event-driven communication across services.

### `rabbitmq`

- Image: `rabbitmq:3-management`
- Ports:
  - `5672:5672` for application messaging
  - `15672:15672` for the management UI
- Purpose: task queue and background job processing

Used by:

- Notification Service for email delivery jobs
- Payroll Service for background processing tasks
- Any future long-running or retryable job worker

Why it exists:

- The requirements call for queued tasks and retryable background processing, especially for notifications.

## How These Containers Fit the Project

The frontend React app does not talk to these containers directly. It talks to the backend API gateway and the gateway will later route requests to the correct services.

The backend microservices use these containers depending on the business domain:

- PostgreSQL for transactions that must be consistent
- MongoDB for flexible business documents
- Redis for fast session and cache access
- Kafka for events between services
- RabbitMQ for background jobs and retries

## What Happens When You Run Compose

When you run `docker compose up -d`, you start the shared infrastructure needed by the ERP platform. The services themselves are separate Node.js processes that you run from their own workspace commands.

So the startup flow is:

1. Start Docker Compose
2. Start the frontend React app
3. Start the API gateway
4. Start any additional backend services you want to test

## Current Status

At the current scaffold stage, the containers are set up correctly for the future implementation, but most services are not yet wired to real database clients or message producers/consumers.

That means the compose file is already useful for local infrastructure setup, even though the business logic is still being built.