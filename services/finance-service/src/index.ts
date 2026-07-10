import { createServiceApp } from '@smartbiz/service-kit';

const app = createServiceApp({ name: 'finance-service', port: 3008 });

app.get('/api/v1/finance', (_request, response) => {
  response.status(501).json({ message: 'Income, expenses, profit, cash flow, and reports APIs will live here.' });
});

app.listen(3008, () => {
  console.log('finance-service listening on port 3008');
});