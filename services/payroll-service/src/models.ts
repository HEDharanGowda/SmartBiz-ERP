import type { Db, Collection } from 'mongodb';
import { randomUUID } from 'node:crypto';

export type PayrollRecord = {
  id: string;
  employeeId: string;
  companyId: string;
  month: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  taxAmount: number;
  netSalary: number;
  workingDays: number;
  absentDays: number;
  status: 'pending' | 'processed' | 'paid';
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type TaxBracket = {
  id: string;
  companyId: string;
  minIncome: number;
  maxIncome: number;
  taxRate: number;
  createdAt: string;
};

export class PayrollModel {
  private payrolls: Collection<PayrollRecord>;
  private taxBrackets: Collection<TaxBracket>;

  constructor(db: Db) {
    this.payrolls = db.collection<PayrollRecord>('payroll_records');
    this.taxBrackets = db.collection<TaxBracket>('tax_brackets');
  }

  async ensureIndexes() {
    await Promise.all([
      this.payrolls.createIndex({ employeeId: 1, month: 1 }, { unique: true }),
      this.payrolls.createIndex({ companyId: 1 }),
      this.payrolls.createIndex({ status: 1 }),
      this.taxBrackets.createIndex({ companyId: 1 })
    ]);
  }

  async create(payroll: Omit<PayrollRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<PayrollRecord> {
    const now = new Date().toISOString();
    const newPayroll: PayrollRecord = {
      ...payroll,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now
    };

    await this.payrolls.insertOne(newPayroll);
    return newPayroll;
  }

  async findById(id: string): Promise<PayrollRecord | null> {
    return this.payrolls.findOne({ id });
  }

  async findByEmployeeAndMonth(employeeId: string, month: string): Promise<PayrollRecord | null> {
    return this.payrolls.findOne({ employeeId, month });
  }

  async findByCompany(companyId: string, month?: string): Promise<PayrollRecord[]> {
    const filter: any = { companyId };
    if (month) {
      filter.month = month;
    }
    return this.payrolls.find(filter).toArray();
  }

  async update(id: string, updates: Partial<PayrollRecord>): Promise<PayrollRecord | null> {
    const result = await this.payrolls.findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    return result || null;
  }

  async getTaxBrackets(companyId: string): Promise<TaxBracket[]> {
    return this.taxBrackets.find({ companyId }).sort({ minIncome: 1 }).toArray();
  }

  async createTaxBracket(bracket: Omit<TaxBracket, 'id' | 'createdAt'>): Promise<TaxBracket> {
    const newBracket: TaxBracket = {
      ...bracket,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    await this.taxBrackets.insertOne(newBracket);
    return newBracket;
  }
}
