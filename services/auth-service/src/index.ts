import { createServiceApp } from '@smartbiz/service-kit';

const app = createServiceApp({ name: 'auth-service', port: 3001 });

app.post('/api/v1/auth/login', (_request, response) => {
  response.status(501).json({ message: 'JWT, refresh token, and OTP flow will be implemented here.' });
});

app.post('/api/v1/auth/register', (_request, response) => {
  response.status(501).json({ message: 'Email verification and account creation will be implemented here.' });
});

app.post('/api/v1/auth/refresh', (_request, response) => {
  response.status(501).json({ message: 'Refresh token exchange will be implemented here.' });
});

app.listen(3001, () => {
  console.log('auth-service listening on port 3001');
});