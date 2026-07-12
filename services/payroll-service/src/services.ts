import type { PayrollModel, PayrollRecord, TaxBracket } from './models.js';

export class PayrollService {
  constructor(private model: PayrollModel) {}

  calculateTax(grossSalary: number, taxBrackets: TaxBracket[]): number {
    let taxAmount = 0;
    for (const bracket of taxBrackets) {
      if (grossSalary > bracket.minIncome) {
        const taxableInBracket = Math.min(
          grossSalary - bracket.minIncome,
          bracket.maxIncome - bracket.minIncome
        );
        taxAmount += (taxableInBracket * bracket.taxRate) / 100;
      }
    }
    return Math.round(taxAmount * 100) / 100;
  }

  async processPayroll(data: {
    employeeId: string;
    companyId: string;
    month: string;
    baseSalary: number;
    bonuses?: number;
    deductions?: number;
    workingDays: number;
    absentDays: number;
  }): Promise<PayrollRecord> {
    const existing = await this.model.findByEmployeeAndMonth(data.employeeId, data.month);
    if (existing) {
      throw new Error('Payroll already processed for this employee and month');
    }

    const bonuses = data.bonuses ?? 0;
    const deductions = data.deductions ?? 0;
    const grossSalary = data.baseSalary + bonuses;

    const taxBrackets = await this.model.getTaxBrackets(data.companyId);
    const taxAmount = this.calculateTax(grossSalary, taxBrackets);
    const netSalary = grossSalary - deductions - taxAmount;

    return this.model.create({
      employeeId: data.employeeId,
      companyId: data.companyId,
      month: data.month,
      baseSalary: data.baseSalary,
      bonuses,
      deductions,
      taxAmount,
      netSalary,
      workingDays: data.workingDays,
      absentDays: data.absentDays,
      status: 'processed',
      processedAt: new Date().toISOString()
    });
  }

  async getPayroll(id: string): Promise<PayrollRecord | null> {
    return this.model.findById(id);
  }

  async listPayrolls(companyId: string, month?: string): Promise<PayrollRecord[]> {
    return this.model.findByCompany(companyId, month);
  }

  async updatePayrollStatus(id: string, status: 'pending' | 'processed' | 'paid'): Promise<PayrollRecord | null> {
    return this.model.update(id, { status });
  }

  async getTaxBrackets(companyId: string): Promise<TaxBracket[]> {
    return this.model.getTaxBrackets(companyId);
  }

  async createTaxBracket(data: Omit<TaxBracket, 'id' | 'createdAt'>): Promise<TaxBracket> {
    return this.model.createTaxBracket(data);
  }
}
