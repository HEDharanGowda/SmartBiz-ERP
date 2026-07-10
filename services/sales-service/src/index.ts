import { createServiceApp } from '@smartbiz/service-kit';

const app = createServiceApp({ name: 'sales-service', port: 3007 });

app.get('/api/v1/sales', (_request, response) => {
  response.status(501).json({ message: 'Customers, invoices, payments, GST, and revenue APIs will live here.' });
});

app.listen(3007, () => {
  console.log('sales-service listening on port 3007');
});