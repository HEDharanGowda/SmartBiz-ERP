# SmartBiz ERP

SmartBiz ERP is a Node.js and React microservices platform for small businesses. The architecture follows the attached requirements and the Word document guidance:

- Node.js backend microservices
- React frontend for the executive dashboard and user-facing flows
- PostgreSQL for transactional data
- MongoDB for flexible document-oriented data
- Redis for sessions, dashboard caching, and other hot data
- Kafka for domain events
- RabbitMQ for task queues and background jobs

## Services

- API Gateway
- Auth Service
- Organization Service
- Employee Service
- Attendance Service
- Payroll Service
- Inventory Service
- Sales Service
- Finance Service
- Notification Service
- Dashboard Service

## Current State

This repository is scaffolded with the service boundaries, shared contracts, and infrastructure entry points needed to implement the requirements incrementally.