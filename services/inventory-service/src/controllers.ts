import type { Response } from 'express';
import type { AuthenticatedRequest } from '@smartbiz/shared';
import type { InventoryService } from './services.js';

export class InventoryController {
  constructor(private service: InventoryService) {}

  async createProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const product = await this.service.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create product' });
    }
  }

  async getProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const product = await this.service.getProduct(req.params.id);
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to get product' });
    }
  }

  async listProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const { companyId } = req.query;
      const products = await this.service.listProducts(String(companyId));
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to list products' });
    }
  }

  async getStockLevel(req: AuthenticatedRequest, res: Response) {
    try {
      const { warehouseId } = req.query;
      const level = await this.service.getStockLevel(req.params.id, String(warehouseId));
      res.json(level);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to get stock level' });
    }
  }

  async adjustStock(req: AuthenticatedRequest, res: Response) {
    try {
      const movement = await this.service.adjustStock({
        ...req.body,
        userId: req.user!.id
      });
      res.status(201).json(movement);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to adjust stock' });
    }
  }

  async getStockMovements(req: AuthenticatedRequest, res: Response) {
    try {
      const movements = await this.service.getStockMovements(req.params.id);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to get stock movements' });
    }
  }

  async getLowStockProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const { companyId } = req.query;
      const products = await this.service.getLowStockProducts(String(companyId));
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to get low stock products' });
    }
  }
}
