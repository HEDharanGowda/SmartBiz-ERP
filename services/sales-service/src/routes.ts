import { Router } from 'express';
import type { SalesController } from './controllers.js';
import { authenticateToken, authorizeRoles } from '@smartbiz/shared';

export function createSalesRoutes(controller: SalesController) {
  const router = Router();

  router.post(
    '/api/v1/sales/customers',
    authenticateToken,
    authorizeRoles('Admin', 'Manager', 'Owner'),
    controller.createCustomer.bind(controller)
  );

  router.get(
    '/api/v1/sales/customers',
    authenticateToken,
    controller.listCustomers.bind(controller)
  );

  router.post(
    '/api/v1/sales/invoices',
    authenticateToken,
    authorizeRoles('Admin', 'Manager', 'Owner'),
    controller.createInvoice.bind(controller)
  );

  router.get(
    '/api/v1/sales/invoices',
    authenticateToken,
    controller.listInvoices.bind(controller)
  );

  router.get(
    '/api/v1/sales/invoices/:id',
    authenticateToken,
    controller.getInvoice.bind(controller)
  );

  router.post(
    '/api/v1/sales/invoices/:id/payments',
    authenticateToken,
    authorizeRoles('Admin', 'Manager', 'Owner'),
    controller.recordPayment.bind(controller)
  );

  router.get(
    '/api/v1/sales/invoices/:id/payments',
    authenticateToken,
    controller.getPayments.bind(controller)
  );

  router.get(
    '/api/v1/sales/revenue',
    authenticateToken,
    authorizeRoles('Admin', 'Owner'),
    controller.getTotalRevenue.bind(controller)
  );

  return router;
}
