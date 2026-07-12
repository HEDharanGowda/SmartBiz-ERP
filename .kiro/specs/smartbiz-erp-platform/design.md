# Design Document: SmartBiz ERP Platform

## Overview

SmartBiz ERP is an enterprise-grade, cloud-native ERP platform designed for small businesses with up to 50 employees. The system follows a microservices architecture pattern with domain-driven design principles, providing integrated solutions for authentication, HR management, payroll processing, inventory control, sales operations, and financial reporting.

### System Goals

The platform aims to deliver:

- **Scalability**: Horizontal scaling through containerized microservices with independent deployment capabilities
- **Reliability**: ACID guarantees for financial transactions, event-driven eventual consistency for cross-service operations
- **Performance**: Sub-100ms API response times through intelligent caching and database optimization
- **Security**: JWT-based authentication with refresh tokens, role-based access control, and comprehensive audit trails
- **Maintainability**: Clear service boundaries, standardized communication patterns, and comprehensive observability

### Technology Stack

**Backend Services**: Node.js with TypeScript and Express framework  
**API Gateway**: Express-based routing layer with authentication middleware  
**Frontend**: React with TypeScript and Vite build tooling  
**Primary Database**: PostgreSQL 16 for transactional data (payroll, sales, finance, attendance, inventory transactions)  
**Document Database**: MongoDB 7 for flexible schema documents (employee profiles, organizational structure, notifications)  
**Cache Layer**: Redis 7 for session storage and frequently accessed metrics  
**Event Streaming**: Apache Kafka for publish-subscribe event distribution  
**Task Queue**: RabbitMQ for background job processing and retryable tasks  
**Container Runtime**: Docker with Docker Compose for local development  


## Architecture

### Microservices Design

The platform is decomposed into 11 microservices organized by business domain:

**1. API Gateway**  
Entry point for all client requests, routing to backend services based on URL patterns. Implements cross-cutting concerns including authentication verification, rate limiting (1000 requests/minute/user), request timeout (30 seconds), and CORS policies.

**2. Auth Service**  
Manages user authentication, authorization, session lifecycle, email verification, password reset, and OTP-based multi-factor authentication. Uses MongoDB for user documents and refresh tokens, Redis for active sessions and OTP challenges.

**3. Organization Service**  
Handles company account management, department hierarchy (3-level nesting), and role-based access control (Owner, Admin, Manager, Employee, Accountant). Uses MongoDB for organizational documents.

**4. Employee Service**  
Manages employee lifecycle including profile creation, document uploads (10MB limit), promotions, salary changes, manager assignments, and terminations. Stores profiles in MongoDB and salary history in PostgreSQL.

**5. Attendance Service**  
Tracks employee check-in/check-out with location data, calculates working hours, manages leave requests (Sick, Casual, Vacation, Unpaid), maintains holiday calendars, and identifies late arrivals (>15 minutes past shift start). Uses PostgreSQL for transactional attendance records.

**6. Payroll Service**  
Processes monthly salary calculations based on base salary, attendance, bonuses, and deductions. Applies tax brackets, generates payslip PDFs, implements pro-rated calculations for partial employment, and prevents duplicate processing. Uses PostgreSQL for ACID-compliant payroll transactions.

