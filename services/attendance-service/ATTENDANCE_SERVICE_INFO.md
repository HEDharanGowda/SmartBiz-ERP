# Attendance Service Info

## Purpose

The Attendance Service will track employee check-ins, check-outs, leave requests, late arrivals, and company holiday calendars.

## Current Code

- `src/index.ts` currently exposes a placeholder `GET /api/v1/attendance` endpoint.
- It is set up as a standalone service with the shared service kit.

## Dependencies

- `@smartbiz/service-kit`
- Root Express middleware dependencies from the monorepo

## Intended Architecture

- Attendance records should be stored in PostgreSQL.
- Leave notifications should eventually go through the Notification Service.
- Holiday and lateness rules should be enforced in this service.

## Expected Responsibilities

- Check in and check out
- Calculate daily working hours
- Detect late arrivals
- Prevent duplicate check-ins
- Handle leave requests and leave types
- Maintain company holiday calendar

## What It Will Do Next

- Add PostgreSQL persistence.
- Add check-in/check-out and leave APIs.
- Trigger manager notifications on leave submission.
- Apply holiday and lateness business rules.

## Update Rule

Update this file whenever attendance rules, leave logic, or database behavior changes.