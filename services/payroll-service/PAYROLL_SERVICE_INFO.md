# Payroll Service Info

## Purpose

The Payroll Service will calculate salaries, apply tax and leave deductions, generate payslips, and store salary history.

## Current Code

- `src/index.ts` currently exposes a placeholder `GET /api/v1/payroll` endpoint.
- It uses the shared service kit and is ready to grow into the salary-processing service.

## Dependencies

- `@smartbiz/service-kit`
- Root Express middleware dependencies from the monorepo

## Intended Architecture

- Payroll and payslip records should use PostgreSQL.
- Salary processing must run in transactions.
- Payroll completion should publish a Kafka event.
- Notification Service should email payslips.

## Expected Responsibilities

- Monthly salary calculation
- Tax deduction
- Bonus and deduction handling
- Leave without pay calculation
- Payslip PDF generation
- Salary history maintenance

## What It Will Do Next

- Add PostgreSQL transaction logic.
- Add salary calculation endpoints.
- Generate and store payslip records.
- Publish payroll processed events.

## Update Rule

Update this file whenever payroll formulas, tax logic, payslip generation, or event publishing changes.