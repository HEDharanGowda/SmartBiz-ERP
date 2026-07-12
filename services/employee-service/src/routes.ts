import { Router } from 'express';
import type { EmployeeController } from './controllers.js';
import { authenticateToken, authorizeRoles } from '@smartbiz/shared';

export function createEmployeeRoutes(controller: EmployeeController) {
  const router = Router();

  router.post(
    '/api/v1/employees',
    authenticateToken,
    authorizeRoles('Admin', 'Manager', 'Owner'),
    controller.create.bind(controller)
  );

  router.get(
    '/api/v1/employees',
    authenticateToken,
    controller.list.bind(controller)
  );

  router.get(
    '/api/v1/employees/:id',
    authenticateToken,
    controller.get.bind(controller)
  );

  router.put(
    '/api/v1/employees/:id',
    authenticateToken,
    authorizeRoles('Admin', 'Manager', 'Owner'),
    controller.update.bind(controller)
  );

  router.post(
    '/api/v1/employees/:id/promote',
    authenticateToken,
    authorizeRoles('Admin', 'Owner'),
    controller.promote.bind(controller)
  );

  router.post(
    '/api/v1/employees/:id/terminate',
    authenticateToken,
    authorizeRoles('Admin', 'Owner'),
    controller.terminate.bind(controller)
  );

  router.post(
    '/api/v1/employees/:id/salary',
    authenticateToken,
    authorizeRoles('Admin', 'Owner'),
    controller.updateSalary.bind(controller)
  );

  router.get(
    '/api/v1/employees/:id/salary-history',
    authenticateToken,
    authorizeRoles('Admin', 'Owner'),
    controller.getSalaryHistory.bind(controller)
  );

  return router;
}
