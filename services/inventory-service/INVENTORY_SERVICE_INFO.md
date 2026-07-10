# Inventory Service Info

## Purpose

The Inventory Service will manage products, stock, warehouses, vendors, purchase orders, and stock movement tracking.

## Current Code

- `src/index.ts` currently exposes a placeholder `GET /api/v1/inventory` endpoint.
- The service is scaffolded and ready for business logic.

## Dependencies

- `@smartbiz/service-kit`
- Root Express middleware dependencies from the monorepo

## Intended Architecture

- Product details should be stored in MongoDB.
- Stock levels, purchase orders, and movement history should use PostgreSQL.
- Low stock alerts should be published to Kafka.

## Expected Responsibilities

- Products and warehouses
- Vendor records
- Stock additions and removals
- Purchase order handling
- Barcode support
- Movement history and stock thresholds

## What It Will Do Next

- Add MongoDB product models.
- Add PostgreSQL stock and movement models.
- Emit low stock events.
- Add purchase order and warehouse APIs.

## Update Rule

Update this file whenever inventory, warehouse, stock movement, or vendor logic changes.