import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { createServiceApp } from '@smartbiz/service-kit';
import { SalesModel } from './models.js';
import { SalesService } from './services.js';
import { SalesController } from './controllers.js';
import { createSalesRoutes } from './routes.js';

const mongoClient = new MongoClient(process.env.MONGODB_URL ?? 'mongodb://localhost:27017');
const databaseName = process.env.MONGODB_DB ?? 'smartbiz_erp';

const app = createServiceApp({ name: 'sales-service', port: 3007 });

async function start() {
  await mongoClient.connect();
  const db = mongoClient.db(databaseName);

  const model = new SalesModel(db);
  await model.ensureIndexes();

  const service = new SalesService(model);
  const controller = new SalesController(service);
  const routes = createSalesRoutes(controller);

  app.use(routes);

  app.listen(3007, () => {
    console.log('sales-service listening on port 3007');
  });
}

start().catch((error) => {
  console.error('sales-service failed to start:', error);
  process.exit(1);
});