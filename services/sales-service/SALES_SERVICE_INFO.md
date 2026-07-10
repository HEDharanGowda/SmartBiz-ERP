# Sales Service Info

## Purpose

The Sales Service will manage customers, invoices, invoice numbering, GST, payments, payment history, and revenue tracking.

## Current Code

- `src/index.ts` currently exposes a placeholder `GET /api/v1/sales` endpoint.
- The service is set up to become the sales and billing domain.

## Dependencies

- `@smartbiz/service-kit`
- Root Express middleware dependencies from the monorepo

## Intended Architecture

- Customer records should use MongoDB.
- Invoices and payments should use PostgreSQL.
- Invoice creation and payment events should publish to Kafka.
- Notification Service should send invoice emails.

## Expected Responsibilities

- Customer management
- Invoice creation and numbering
- GST calculation
- Payment status tracking
- Revenue calculation
- Invoice PDF generation

## What It Will Do Next

- Add PostgreSQL transaction logic for invoices and payments.
- Add customer storage in MongoDB.
- Add invoice and payment events.
- Add due-date and overdue handling.

## Update Rule

Update this file whenever invoice rules, payment workflows, customer fields, or revenue calculations change.