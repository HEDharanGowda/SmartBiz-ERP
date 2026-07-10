import { createServiceApp } from '@smartbiz/service-kit';

const app = createServiceApp({ name: 'employee-service', port: 3003 });

app.get('/api/v1/employees', (_request, response) => {
  response.status(501).json({ message: 'Employee profiles, documents, history, and lifecycle APIs will live here.' });
});

app.listen(3003, () => {
  console.log('employee-service listening on port 3003');
});