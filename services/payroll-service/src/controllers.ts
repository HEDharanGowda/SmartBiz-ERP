import type { Response } from 'express';
import type { AuthenticatedRequest } from '@smartbiz/shared';
import type { PayrollService } from './services.js';
import type { PayrollQueue } from './queue.js';

export class PayrollController {
  constructor(
    private service: PayrollService,
    private queue: PayrollQueue
  ) {}

  async process(req: AuthenticatedRequest, res: Response) {
    try {
      const payroll = await this.service.processPayroll(req.body);
      res.status(201).json(payroll);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to process payroll' });
    }
  }

  async processBulk(req: AuthenticatedRequest, res: Response) {
    try {
      const { jobs } = req.body;
      if (!Array.isArray(jobs)) {
        res.status(400).json({ message: 'Jobs must be an array' });
        return;
      }

      for (const job of jobs) {
        await this.queue.enqueue(job);
      }

      res.json({
        message: `${jobs.length} payroll jobs queued for background processing`,
        jobCount: jobs.length
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to queue payroll jobs' });
    }
  }

  async get(req: AuthenticatedRequest, res: Response) {
    try {
      const payroll = await this.service.getPayroll(req.params.id);
      if (!payroll) {
        res.status(404).json({ message: 'Payroll record not found' });
        return;
      }
      res.json(payroll);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to get payroll' });
    }
  }

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { companyId, month } = req.query;
      const payrolls = await this.service.listPayrolls(String(companyId), month as string | undefined);
      res.json(payrolls);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to list payrolls' });
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { status } = req.body;
      const payroll = await this.service.updatePayrollStatus(req.params.id, status);
      if (!payroll) {
        res.status(404).json({ message: 'Payroll record not found' });
        return;
      }
      res.json(payroll);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update payroll status' });
    }
  }

  async getTaxBrackets(req: AuthenticatedRequest, res: Response) {
    try {
      const { companyId } = req.query;
      const brackets = await this.service.getTaxBrackets(String(companyId));
      res.json(brackets);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to get tax brackets' });
    }
  }

  async createTaxBracket(req: AuthenticatedRequest, res: Response) {
    try {
      const bracket = await this.service.createTaxBracket(req.body);
      res.status(201).json(bracket);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create tax bracket' });
    }
  }
}
