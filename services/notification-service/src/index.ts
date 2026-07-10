import { createServiceApp } from '@smartbiz/service-kit';

const app = createServiceApp({ name: 'notification-service', port: 3009 });

app.get('/api/v1/notifications', (_request, response) => {
  response.status(501).json({ message: 'Email, in-app, preference, and retry orchestration APIs will live here.' });
});

app.listen(3009, () => {
  console.log('notification-service listening on port 3009');
});