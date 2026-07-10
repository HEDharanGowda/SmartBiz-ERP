import { createServiceApp } from '@smartbiz/service-kit';

const app = createServiceApp({ name: 'api-gateway', port: 3000 });

app.get('/api/v1/routes', (_request, response) => {
  response.json({
    service: 'api-gateway',
    routes: [
      '/api/v1/auth',
      '/api/v1/organizations',
      '/api/v1/employees',
      '/api/v1/attendance',
      '/api/v1/payroll',
      '/api/v1/inventory',
      '/api/v1/sales',
      '/api/v1/finance',
      '/api/v1/notifications',
      '/api/v1/dashboard'
    ]
  });
});

app.listen(3000, () => {
  console.log('api-gateway listening on port 3000');
});