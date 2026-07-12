import type { Db, Collection } from 'mongodb';
import { randomUUID } from 'node:crypto';

export type Employee = {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  position: string;
  department: string;
  managerId?: string;
  baseSalary: number;
  status: 'active' | 'inactive';
  joinedAt: string;
  terminatedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SalaryHistory = {
  id: string;
  employeeId: string;
  companyId: string;
  previousSalary: number;
  newSalary: number;
  effectiveDate: string;
  reason: string;
  createdBy: string;
  createdAt: string;
};

export class EmployeeModel {
  private employees: Collection<Employee>;
  private salaryHistory: Collection<SalaryHistory>;

  constructor(db: Db) {
    this.employees = db.collection<Employee>('employees');
    this.salaryHistory = db.collection<SalaryHistory>('salary_history');
  }

  async ensureIndexes() {
    await Promise.all([
      this.employees.createIndex({ companyId: 1 }),
      this.employees.createIndex({ email: 1 }),
      this.employees.createIndex({ status: 1 }),
      this.salaryHistory.createIndex({ employeeId: 1 }),
      this.salaryHistory.createIndex({ companyId: 1 })
    ]);
  }

  async create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const now = new Date().toISOString();
    const newEmployee: Employee = {
      ...employee,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now
    };

    await this.employees.insertOne(newEmployee);
    return newEmployee;
  }

  async findById(id: string): Promise<Employee | null> {
    return this.employees.findOne({ id });
  }

  async findByCompany(companyId: string, status?: 'active' | 'inactive'): Promise<Employee[]> {
    const filter: any = { companyId };
    if (status) {
      filter.status = status;
    }
    return this.employees.find(filter).toArray();
  }

  async update(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    const result = await this.employees.findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    return result || null;
  }

  async updateSalary(employeeId: string, newSalary: number, reason: string, createdBy: string): Promise<void> {
    const employee = await this.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const history: SalaryHistory = {
      id: randomUUID(),
      employeeId,
      companyId: employee.companyId,
      previousSalary: employee.baseSalary,
      newSalary,
      effectiveDate: new Date().toISOString(),
      reason,
      createdBy,
      createdAt: new Date().toISOString()
    };

    await this.salaryHistory.insertOne(history);
    await this.update(employeeId, { baseSalary: newSalary });
  }

  async getSalaryHistory(employeeId: string): Promise<SalaryHistory[]> {
    return this.salaryHistory.find({ employeeId }).sort({ createdAt: -1 }).toArray();
  }
}
