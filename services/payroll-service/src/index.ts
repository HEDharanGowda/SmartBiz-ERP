import { createServiceApp } from '@smartbiz/service-kit';

const app = createServiceApp({ name: 'payroll-service', port: 3005 });

app.get('/api/v1/payroll', (_request, response) => {
  response.status(501).json({ message: 'Salary calculation, tax, payslip, and salary history APIs will live here.' });
});

app.listen(3005, () => {
  console.log('payroll-service listening on port 3005');
});