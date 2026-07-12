import { Router } from 'express';
import type { PayrollController } from './controllers.js';
import { authenticateToken, authorizeRoles } from '@smartbiz/shared';

export function createPayrollRoutes(controller: PayrollController) {
  const router = Router();

  router.post(
    '/api/v1/payroll/process',
    authenticateToken,
    authorizeRoles('Admin', 'Owner'),
    controller.process.bind(controller)
  );

  router.post(
    '/api/v1/payroll/process-bulk',
    authenticateToken,
    authorizeRoles('Admin', 'Owner'),
    controller.processBulk.bind(controller)
  );

  router.get(
    '/api/v1/payroll',
    authenticateToken,
    authorizeRoles('Admin', 'Owner'),
    controller.list.bind(controller)
  );

  router.get(
    '/api/v1/payroll/:id',
    authenticateToken,
    controller.get.bind(controller)
  );

  router.patch(
    '/api/v1/payroll/:id/status',
    authenticateToken,
    authorizeRoles('Admin', 'Owner'),
    controller.updateStatus.bind(controller)
  );

  router.get(
    '/api/v1/payroll/tax-brackets',
    authenticateToken,
    controller.getTaxBrackets.bind(controller)
  );

  router.post(
    '/api/v1/payroll/tax-brackets',
    authenticateToken,
    authorizeRoles('Admin', 'Owner'),
    controller.createTaxBracket.bind(controller)
  );

  return router;
}
