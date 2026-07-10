# Employee Service Info

## Purpose

The Employee Service will manage employee lifecycle data, documents, manager relationships, salary history, and employment history.

## Current Code

- `src/index.ts` exposes a placeholder `GET /api/v1/employees` endpoint.
- The service is scaffolded with the shared service kit.

## Dependencies

- `@smartbiz/service-kit`
- Root Express middleware dependencies from the monorepo

## Intended Architecture

- Employee profiles should be stored in MongoDB.
- Salary history and other transactional lifecycle records should use PostgreSQL where ACID guarantees are needed.
- Employee promotion and termination should publish domain events.

## Expected Responsibilities

- Add employees
- Remove or terminate employees
- Promote employees
- Change salary
- Assign manager per employee
- Upload employee documents

## What It Will Do Next

- Add persistent employee profile storage.
- Add lifecycle transition endpoints.
- Store salary history in PostgreSQL.
- Emit employee lifecycle events to Kafka.

## Update Rule

Update this file when employee record fields, lifecycle rules, document handling, or salary history behavior changes.