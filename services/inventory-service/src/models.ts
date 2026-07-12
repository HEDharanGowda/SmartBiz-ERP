import type { Db, Collection } from 'mongodb';
import { randomUUID } from 'node:crypto';

export type Product = {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  unit: string;
  minStockLevel: number;
  createdAt: string;
  updatedAt: string;
};

export type StockLevel = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  updatedAt: string;
};

export type StockMovement = {
  id: string;
  productId: string;
  warehouseId: string;
  companyId: string;
  type: 'Purchase' | 'Sale' | 'Transfer' | 'Adjustment' | 'Return';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  userId: string;
  notes?: string;
  createdAt: string;
};

export class InventoryModel {
  private products: Collection<Product>;
  private stockLevels: Collection<StockLevel>;
  private stockMovements: Collection<StockMovement>;

  constructor(db: Db) {
    this.products = db.collection<Product>('products');
    this.stockLevels = db.collection<StockLevel>('stock_levels');
    this.stockMovements = db.collection<StockMovement>('stock_movements');
  }

  async ensureIndexes() {
    await Promise.all([
      this.products.createIndex({ companyId: 1 }),
      this.products.createIndex({ sku: 1 }, { unique: true }),
      this.products.createIndex({ barcode: 1 }),
      this.stockLevels.createIndex({ productId: 1, warehouseId: 1 }, { unique: true }),
      this.stockMovements.createIndex({ productId: 1 }),
      this.stockMovements.createIndex({ companyId: 1 })
    ]);
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    await this.products.insertOne(newProduct);
    return newProduct;
  }

  async findProductById(id: string): Promise<Product | null> {
    return this.products.findOne({ id });
  }

  async findProducts(companyId: string): Promise<Product[]> {
    return this.products.find({ companyId }).toArray();
  }

  async getStockLevel(productId: string, warehouseId: string): Promise<StockLevel | null> {
    return this.stockLevels.findOne({ productId, warehouseId });
  }

  async updateStockLevel(productId: string, warehouseId: string, quantity: number): Promise<StockLevel> {
    const result = await this.stockLevels.findOneAndUpdate(
      { productId, warehouseId },
      {
        $set: {
          quantity,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true, returnDocument: 'after' }
    );
    return result!;
  }

  async createStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement> {
    const newMovement: StockMovement = {
      ...movement,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    await this.stockMovements.insertOne(newMovement);
    return newMovement;
  }

  async getStockMovements(productId: string): Promise<StockMovement[]> {
    return this.stockMovements.find({ productId }).sort({ createdAt: -1 }).toArray();
  }

  async getLowStockProducts(companyId: string): Promise<Array<Product & { currentStock: number }>> {
    const products = await this.findProducts(companyId);
    const lowStock: Array<Product & { currentStock: number }> = [];

    for (const product of products) {
      const stocks = await this.stockLevels.find({ productId: product.id }).toArray();
      const totalStock = stocks.reduce((sum, s) => sum + s.quantity, 0);
      if (totalStock < product.minStockLevel) {
        lowStock.push({ ...product, currentStock: totalStock });
      }
    }

    return lowStock;
  }
}
