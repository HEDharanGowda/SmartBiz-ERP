# Notification Service Info

## Purpose

The Notification Service will send email and in-app notifications for events such as payroll processing, inventory alerts, invoice reminders, and user-specific messages.

## Current Code

- `src/index.ts` currently exposes a placeholder `GET /api/v1/notifications` endpoint.
- It is scaffolded as the communication hub for notifications.

## Dependencies

- `@smartbiz/service-kit`
- Root Express middleware dependencies from the monorepo

## Intended Architecture

- In-app notifications should use MongoDB.
- Event consumers should listen to Kafka domain events.
- Retryable email deliveries can use RabbitMQ jobs.

## Expected Responsibilities

- Email notifications
- In-app notifications
- User preferences
- Delivery retries
- Event-driven notification handling

## What It Will Do Next

- Add event consumers for payroll, inventory, and sales events.
- Store notification records in MongoDB.
- Add retry and backoff behavior.
- Add read/unread notification state.

## Update Rule

Update this file whenever notification channels, retry logic, event subscriptions, or storage rules change.