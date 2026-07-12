import type { InventoryModel, Product, StockMovement } from './models.js';

export class InventoryService {
  constructor(private model: InventoryModel) {}

  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return this.model.createProduct(data);
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.model.findProductById(id);
  }

  async listProducts(companyId: string): Promise<Product[]> {
    return this.model.findProducts(companyId);
  }

  async getStockLevel(productId: string, warehouseId: string) {
    const level = await this.model.getStockLevel(productId, warehouseId);
    return level ?? { productId, warehouseId, quantity: 0 };
  }

  async adjustStock(data: {
    productId: string;
    warehouseId: string;
    companyId: string;
    type: 'Purchase' | 'Sale' | 'Transfer' | 'Adjustment' | 'Return';
    quantity: number;
    userId: string;
    notes?: string;
  }): Promise<StockMovement> {
    const currentLevel = await this.model.getStockLevel(data.productId, data.warehouseId);
    const previousQuantity = currentLevel?.quantity ?? 0;

    let quantityChange = data.quantity;
    if (data.type === 'Sale') {
      quantityChange = -Math.abs(data.quantity);
    }

    const newQuantity = previousQuantity + quantityChange;
    if (newQuantity < 0) {
      throw new Error('Stock cannot be negative');
    }

    await this.model.updateStockLevel(data.productId, data.warehouseId, newQuantity);

    return this.model.createStockMovement({
      productId: data.productId,
      warehouseId: data.warehouseId,
      companyId: data.companyId,
      type: data.type,
      quantity: Math.abs(data.quantity),
      previousQuantity,
      newQuantity,
      userId: data.userId,
      notes: data.notes
    });
  }

  async getStockMovements(productId: string): Promise<StockMovement[]> {
    return this.model.getStockMovements(productId);
  }

  async getLowStockProducts(companyId: string) {
    return this.model.getLowStockProducts(companyId);
  }
}
