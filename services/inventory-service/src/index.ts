import { createServiceApp } from '@smartbiz/service-kit';

const app = createServiceApp({ name: 'inventory-service', port: 3006 });

app.get('/api/v1/inventory', (_request, response) => {
  response.status(501).json({ message: 'Products, stock, warehouses, vendors, and movement APIs will live here.' });
});

app.listen(3006, () => {
  console.log('inventory-service listening on port 3006');
});