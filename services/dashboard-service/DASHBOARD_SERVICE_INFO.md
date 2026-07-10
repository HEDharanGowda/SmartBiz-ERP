# Dashboard Service Info

## Purpose

The Dashboard Service will aggregate the business metrics needed by management and the CEO view.

## Current Code

- `src/index.ts` currently exposes a placeholder `GET /api/v1/dashboard` endpoint.
- It is structured as an aggregation service for cross-domain metrics.

## Dependencies

- `@smartbiz/service-kit`
- Root Express middleware dependencies from the monorepo

## Intended Architecture

- Dashboard data should be cached in Redis.
- Metrics should be built from Sales, Finance, Employee, and Inventory service data.
- Relevant events should refresh cached dashboard views.

## Expected Responsibilities

- Revenue aggregation
- Expense aggregation
- Profit calculation
- Employee counts
- Pending invoice metrics
- Low stock counts

## What It Will Do Next

- Add Redis cache for dashboard views.
- Add service-to-service metric aggregation.
- Add event-driven cache refresh.
- Add chart-ready response structures.

## Update Rule

Update this file whenever dashboard metrics, cache rules, or cross-service aggregation changes.