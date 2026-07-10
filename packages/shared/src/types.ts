export type ServiceName =
  | 'api-gateway'
  | 'auth-service'
  | 'organization-service'
  | 'employee-service'
  | 'attendance-service'
  | 'payroll-service'
  | 'inventory-service'
  | 'sales-service'
  | 'finance-service'
  | 'notification-service'
  | 'dashboard-service';

export type HealthResponse = {
  status: 'ok';
  service: ServiceName;
  timestamp: string;
};