import type { EmployeeModel, Employee } from './models.js';

export class EmployeeService {
  constructor(private model: EmployeeModel) {}

  async createEmployee(data: {
    companyId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    position: string;
    department: string;
    managerId?: string;
    baseSalary: number;
  }): Promise<Employee> {
    return this.model.create({
      ...data,
      status: 'active',
      joinedAt: new Date().toISOString()
    });
  }

  async getEmployee(id: string): Promise<Employee | null> {
    return this.model.findById(id);
  }

  async listEmployees(companyId: string, status?: 'active' | 'inactive'): Promise<Employee[]> {
    return this.model.findByCompany(companyId, status);
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    return this.model.update(id, updates);
  }

  async promoteEmployee(id: string, newPosition: string, newDepartment: string): Promise<Employee | null> {
    return this.model.update(id, {
      position: newPosition,
      department: newDepartment
    });
  }

  async terminateEmployee(id: string): Promise<Employee | null> {
    return this.model.update(id, {
      status: 'inactive',
      terminatedAt: new Date().toISOString()
    });
  }

  async updateSalary(employeeId: string, newSalary: number, reason: string, createdBy: string) {
    await this.model.updateSalary(employeeId, newSalary, reason, createdBy);
    return this.model.findById(employeeId);
  }

  async getSalaryHistory(employeeId: string) {
    return this.model.getSalaryHistory(employeeId);
  }
}
