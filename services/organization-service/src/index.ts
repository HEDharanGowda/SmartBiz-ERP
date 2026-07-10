import { createServiceApp } from '@smartbiz/service-kit';

const app = createServiceApp({ name: 'organization-service', port: 3002 });

app.get('/api/v1/organizations', (_request, response) => {
  response.status(501).json({ message: 'Company, department, and role hierarchy APIs will live here.' });
});

app.listen(3002, () => {
  console.log('organization-service listening on port 3002');
});