# Organization Service Info

## Purpose

The Organization Service will manage company accounts, departments, and role-based access structure for each company.

## Current Code

- `src/index.ts` currently exposes a placeholder `GET /api/v1/organizations` endpoint.
- It uses the shared service kit for health and readiness endpoints.

## Dependencies

- `@smartbiz/service-kit`
- Root Express middleware dependencies from the monorepo

## Intended Architecture

- Store organization documents in MongoDB.
- Represent nested department structures up to 3 levels deep.
- Maintain one owner role per company account.
- Publish role assignment events to Kafka.

## Expected Responsibilities

- Company onboarding
- Department creation and hierarchy management
- Role assignment by department
- Owner/admin/manager/employee/accountant permissions

## What It Will Do Next

- Add MongoDB persistence.
- Add role assignment and ownership validation rules.
- Emit organization events for other services.
- Add endpoints for departments, roles, and company accounts.

## Update Rule

Update this file when company structure, department logic, roles, or MongoDB models change.