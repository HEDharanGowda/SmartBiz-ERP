import { createServiceApp } from '@smartbiz/service-kit';

const app = createServiceApp({ name: 'attendance-service', port: 3004 });

app.get('/api/v1/attendance', (_request, response) => {
  response.status(501).json({ message: 'Check-in, check-out, leave, and holiday APIs will live here.' });
});

app.listen(3004, () => {
  console.log('attendance-service listening on port 3004');
});