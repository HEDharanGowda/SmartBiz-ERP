import type { Response } from 'express';
import type { AuthenticatedRequest } from '@smartbiz/shared';
import type { DashboardService } from './services.js';

export class DashboardController {
  constructor(private service: DashboardService) {}

  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const { companyId, refresh } = req.query;
      if (!companyId) {
        res.status(400).json({ message: 'companyId is required' });
        return;
      }

      const forceRefresh = refresh === 'true';
      const stats = await this.service.getStats(String(companyId), forceRefresh);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to get dashboard stats' });
    }
  }

  async invalidateCache(req: AuthenticatedRequest, res: Response) {
    try {
      const { companyId } = req.body;
      if (!companyId) {
        res.status(400).json({ message: 'companyId is required' });
        return;
      }

      await this.service.invalidateCache(companyId);
      res.json({ message: 'Cache invalidated successfully' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to invalidate cache' });
    }
  }
}
