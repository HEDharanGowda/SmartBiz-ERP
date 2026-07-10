import { createServiceApp } from '@smartbiz/service-kit';

const app = createServiceApp({ name: 'dashboard-service', port: 3010 });

app.get('/api/v1/dashboard', (_request, response) => {
  response.status(501).json({ message: 'Revenue, expense, profit, employee, invoice, and inventory metrics APIs will live here.' });
});

app.listen(3010, () => {
  console.log('dashboard-service listening on port 3010');
});