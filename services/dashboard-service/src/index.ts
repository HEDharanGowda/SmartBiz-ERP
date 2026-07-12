import 'dotenv/config';
import { createServiceApp } from '@smartbiz/service-kit';
import { DashboardService } from './services.js';
import { DashboardController } from './controllers.js';
import { createDashboardRoutes } from './routes.js';

const app = createServiceApp({ name: 'dashboard-service', port: 3010 });

async function start() {
  const service = new DashboardService();
  await service.connect();

  const controller = new DashboardController(service);
  const routes = createDashboardRoutes(controller);

  app.use(routes);

  app.listen(3010, () => {
    console.log('dashboard-service listening on port 3010');
  });
}

start().catch((error) => {
  console.error('dashboard-service failed to start:', error);
  process.exit(1);
});