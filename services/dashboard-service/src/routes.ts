import { Router } from 'express';
import type { DashboardController } from './controllers.js';
import { authenticateToken, authorizeRoles } from '@smartbiz/shared';

export function createDashboardRoutes(controller: DashboardController) {
  const router = Router();

  router.get(
    '/api/v1/dashboard/stats',
    authenticateToken,
    controller.getStats.bind(controller)
  );

  router.post(
    '/api/v1/dashboard/invalidate-cache',
    authenticateToken,
    authorizeRoles('Admin', 'Owner'),
    controller.invalidateCache.bind(controller)
  );

  return router;
}
