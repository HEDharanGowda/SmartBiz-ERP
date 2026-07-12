import { Router } from 'express';
import type { InventoryController } from './controllers.js';
import { authenticateToken, authorizeRoles } from '@smartbiz/shared';

export function createInventoryRoutes(controller: InventoryController) {
  const router = Router();

  router.post(
    '/api/v1/inventory/products',
    authenticateToken,
    authorizeRoles('Admin', 'Manager', 'Owner'),
    controller.createProduct.bind(controller)
  );

  router.get(
    '/api/v1/inventory/products',
    authenticateToken,
    controller.listProducts.bind(controller)
  );

  router.get(
    '/api/v1/inventory/products/:id',
    authenticateToken,
    controller.getProduct.bind(controller)
  );

  router.get(
    '/api/v1/inventory/products/:id/stock',
    authenticateToken,
    controller.getStockLevel.bind(controller)
  );

  router.post(
    '/api/v1/inventory/stock/adjust',
    authenticateToken,
    authorizeRoles('Admin', 'Manager', 'Owner'),
    controller.adjustStock.bind(controller)
  );

  router.get(
    '/api/v1/inventory/products/:id/movements',
    authenticateToken,
    controller.getStockMovements.bind(controller)
  );

  router.get(
    '/api/v1/inventory/low-stock',
    authenticateToken,
    controller.getLowStockProducts.bind(controller)
  );

  return router;
}
