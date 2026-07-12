import type { Response } from 'express';
import type { AuthenticatedRequest } from '@smartbiz/shared';
import type { EmployeeService } from './services.js';

export class EmployeeController {
  constructor(private service: EmployeeService) {}

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const employee = await this.service.createEmployee(req.body);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create employee' });
    }
  }

  async get(req: AuthenticatedRequest, res: Response) {
    try {
      const employee = await this.service.getEmployee(req.params.id);
      if (!employee) {
        res.status(404).json({ message: 'Employee not found' });
        return;
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to get employee' });
    }
  }

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { companyId, status } = req.query;
      const employees = await this.service.listEmployees(
        String(companyId),
        status as 'active' | 'inactive' | undefined
      );
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to list employees' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const employee = await this.service.updateEmployee(req.params.id, req.body);
      if (!employee) {
        res.status(404).json({ message: 'Employee not found' });
        return;
      }
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update employee' });
    }
  }

  async promote(req: AuthenticatedRequest, res: Response) {
    try {
      const { newPosition, newDepartment } = req.body;
      const employee = await this.service.promoteEmployee(req.params.id, newPosition, newDepartment);
      if (!employee) {
        res.status(404).json({ message: 'Employee not found' });
        return;
      }
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to promote employee' });
    }
  }

  async terminate(req: AuthenticatedRequest, res: Response) {
    try {
      const employee = await this.service.terminateEmployee(req.params.id);
      if (!employee) {
        res.status(404).json({ message: 'Employee not found' });
        return;
      }
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to terminate employee' });
    }
  }

  async updateSalary(req: AuthenticatedRequest, res: Response) {
    try {
      const { newSalary, reason } = req.body;
      const employee = await this.service.updateSalary(
        req.params.id,
        newSalary,
        reason,
        req.user!.id
      );
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update salary' });
    }
  }

  async getSalaryHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const history = await this.service.getSalaryHistory(req.params.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to get salary history' });
    }
  }
}
