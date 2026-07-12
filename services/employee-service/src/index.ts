import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { createServiceApp } from '@smartbiz/service-kit';
import { EmployeeModel } from './models.js';
import { EmployeeService } from './services.js';
import { EmployeeController } from './controllers.js';
import { createEmployeeRoutes } from './routes.js';

const mongoClient = new MongoClient(process.env.MONGODB_URL ?? 'mongodb://localhost:27017');
const databaseName = process.env.MONGODB_DB ?? 'smartbiz_erp';

const app = createServiceApp({ name: 'employee-service', port: 3003 });

async function start() {
  await mongoClient.connect();
  const db = mongoClient.db(databaseName);

  const model = new EmployeeModel(db);
  await model.ensureIndexes();

  const service = new EmployeeService(model);
  const controller = new EmployeeController(service);
  const routes = createEmployeeRoutes(controller);

  app.use(routes);

  app.listen(3003, () => {
    console.log('employee-service listening on port 3003');
  });
}

start().catch((error) => {
  console.error('employee-service failed to start:', error);
  process.exit(1);
});