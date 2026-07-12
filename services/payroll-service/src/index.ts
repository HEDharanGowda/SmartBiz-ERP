import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { createServiceApp } from '@smartbiz/service-kit';
import { PayrollModel } from './models.js';
import { PayrollService } from './services.js';
import { PayrollController } from './controllers.js';
import { PayrollQueue } from './queue.js';
import { createPayrollRoutes } from './routes.js';

const mongoClient = new MongoClient(process.env.MONGODB_URL ?? 'mongodb://localhost:27017');
const databaseName = process.env.MONGODB_DB ?? 'smartbiz_erp';

const app = createServiceApp({ name: 'payroll-service', port: 3005 });

async function start() {
  await mongoClient.connect();
  const db = mongoClient.db(databaseName);

  const model = new PayrollModel(db);
  await model.ensureIndexes();

  const service = new PayrollService(model);
  const queue = new PayrollQueue();
  await queue.connect();

  // Start background worker
  await queue.startWorker(service);

  const controller = new PayrollController(service, queue);
  const routes = createPayrollRoutes(controller);

  app.use(routes);

  app.listen(3005, () => {
    console.log('payroll-service listening on port 3005');
  });
}

start().catch((error) => {
  console.error('payroll-service failed to start:', error);
  process.exit(1);
});