import { createClient, type RedisClientType } from 'redis';

export type DashboardStats = {
  companyId: string;
  totalEmployees: number;
  activeEmployees: number;
  totalRevenue: number;
  pendingInvoices: number;
  pendingInvoiceValue: number;
  lowStockCount: number;
  cachedAt: string;
};

export class DashboardService {
  private redis: RedisClientType;
  private cacheExpiry = 300; // 5 minutes

  constructor() {
    this.redis = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' });
    this.redis.on('error', (err) => console.error('Dashboard Redis error:', err));
  }

  async connect() {
    if (!this.redis.isOpen) {
      await this.redis.connect();
    }
  }

  private cacheKey(companyId: string) {
    return `smartbiz:dashboard:stats:${companyId}`;
  }

  async getCachedStats(companyId: string): Promise<DashboardStats | null> {
    const cached = await this.redis.get(this.cacheKey(companyId));
    return cached ? JSON.parse(cached) : null;
  }

  async fetchStats(companyId: string): Promise<DashboardStats> {
    // Fetch from microservices
    const [employeeData, salesData, inventoryData] = await Promise.all([
      this.fetchFromService(`http://localhost:3003/api/v1/employees?companyId=${companyId}`),
      this.fetchFromService(`http://localhost:3007/api/v1/sales/invoices?companyId=${companyId}`),
      this.fetchFromService(`http://localhost:3006/api/v1/inventory/low-stock?companyId=${companyId}`)
    ]);

    const employees = employeeData || [];
    const invoices = salesData || [];
    const lowStock = inventoryData || [];

    const pendingInvoices = invoices.filter((inv: any) => inv.status !== 'Fully_Paid');
    const pendingInvoiceValue = pendingInvoices.reduce((sum: number, inv: any) => sum + inv.total, 0);

    const stats: DashboardStats = {
      companyId,
      totalEmployees: employees.length,
      activeEmployees: employees.filter((emp: any) => emp.status === 'active').length,
      totalRevenue: await this.fetchRevenue(companyId),
      pendingInvoices: pendingInvoices.length,
      pendingInvoiceValue,
      lowStockCount: lowStock.length,
      cachedAt: new Date().toISOString()
    };

    await this.redis.set(this.cacheKey(companyId), JSON.stringify(stats), {
      EX: this.cacheExpiry
    });

    return stats;
  }

  private async fetchFromService(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error(`Failed to fetch from ${url}:`, error);
      return null;
    }
  }

  private async fetchRevenue(companyId: string): Promise<number> {
    try {
      const response = await fetch(`http://localhost:3007/api/v1/sales/revenue?companyId=${companyId}`);
      if (!response.ok) return 0;
      const data = await response.json();
      return data.revenue || 0;
    } catch (error) {
      console.error('Failed to fetch revenue:', error);
      return 0;
    }
  }

  async getStats(companyId: string, forceRefresh = false): Promise<DashboardStats> {
    if (!forceRefresh) {
      const cached = await this.getCachedStats(companyId);
      if (cached) {
        return cached;
      }
    }

    return this.fetchStats(companyId);
  }

  async invalidateCache(companyId: string) {
    await this.redis.del(this.cacheKey(companyId));
  }

  async storeOtp(email: string, otp: string, ttl = 300) {
    const key = `smartbiz:otp:${email}`;
    await this.redis.set(key, otp, { EX: ttl });
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const key = `smartbiz:otp:${email}`;
    const stored = await this.redis.get(key);
    if (stored === otp) {
      await this.redis.del(key);
      return true;
    }
    return false;
  }

  async close() {
    await this.redis.quit();
  }
}
