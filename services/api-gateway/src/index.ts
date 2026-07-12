import { createServiceApp } from '@smartbiz/service-kit';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

const app = createServiceApp({ name: 'api-gateway', port: 3000 });

// Auth Service
app.use(
  '/api/v1/auth',
  createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody
    }
  })
);

// Employee Service
app.use(
  '/api/v1/employees',
  createProxyMiddleware({
    target: 'http://localhost:3003',
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody
    }
  })
);

// Payroll Service
app.use(
  '/api/v1/payroll',
  createProxyMiddleware({
    target: 'http://localhost:3005',
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody
    }
  })
);

// Inventory Service
app.use(
  '/api/v1/inventory',
  createProxyMiddleware({
    target: 'http://localhost:3006',
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody
    }
  })
);

// Sales Service
app.use(
  '/api/v1/sales',
  createProxyMiddleware({
    target: 'http://localhost:3007',
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody
    }
  })
);

// Dashboard Service
app.use(
  '/api/v1/dashboard',
  createProxyMiddleware({
    target: 'http://localhost:3010',
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody
    }
  })
);

app.get('/api/v1/routes', (_request, response) => {
  response.json({
    service: 'api-gateway',
    routes: [
      '/api/v1/auth',
      '/api/v1/employees',
      '/api/v1/payroll',
      '/api/v1/inventory',
      '/api/v1/sales',
      '/api/v1/dashboard'
    ]
  });
});

app.listen(3000, () => {
  console.log('api-gateway listening on port 3000');
});