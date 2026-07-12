import type { Response } from 'express';
import type { AuthenticatedRequest } from '@smartbiz/shared';
import type { SalesService } from './services.js';

export class SalesController {
  constructor(private service: SalesService) {}

  async createCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const customer = await this.service.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create customer' });
    }
  }

  async listCustomers(req: AuthenticatedRequest, res: Response) {
    try {
      const { companyId } = req.query;
      const customers = await this.service.listCustomers(String(companyId));
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to list customers' });
    }
  }

  async createInvoice(req: AuthenticatedRequest, res: Response) {
    try {
      const invoice = await this.service.createInvoice({
        ...req.body,
        createdBy: req.user!.id
      });
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create invoice' });
    }
  }

  async getInvoice(req: AuthenticatedRequest, res: Response) {
    try {
      const invoice = await this.service.getInvoice(req.params.id);
      if (!invoice) {
        res.status(404).json({ message: 'Invoice not found' });
        return;
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to get invoice' });
    }
  }

  async listInvoices(req: AuthenticatedRequest, res: Response) {
    try {
      const { companyId, status } = req.query;
      const invoices = await this.service.listInvoices(String(companyId), status as string | undefined);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to list invoices' });
    }
  }

  async recordPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const payment = await this.service.recordPayment({
        ...req.body,
        createdBy: req.user!.id
      });
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to record payment' });
    }
  }

  async getPayments(req: AuthenticatedRequest, res: Response) {
    try {
      const payments = await this.service.getPayments(req.params.id);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to get payments' });
    }
  }

  async getTotalRevenue(req: AuthenticatedRequest, res: Response) {
    try {
      const { companyId } = req.query;
      const revenue = await this.service.getTotalRevenue(String(companyId));
      res.json({ companyId, revenue });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to get revenue' });
    }
  }
}
