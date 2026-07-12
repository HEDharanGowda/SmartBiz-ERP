import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { createServiceApp } from '@smartbiz/service-kit';
import { InventoryModel } from './models.js';
import { InventoryService } from './services.js';
import { InventoryController } from './controllers.js';
import { createInventoryRoutes } from './routes.js';

const mongoClient = new MongoClient(process.env.MONGODB_URL ?? 'mongodb://localhost:27017');
const databaseName = process.env.MONGODB_DB ?? 'smartbiz_erp';

const app = createServiceApp({ name: 'inventory-service', port: 3006 });

async function start() {
  await mongoClient.connect();
  const db = mongoClient.db(databaseName);

  const model = new InventoryModel(db);
  await model.ensureIndexes();

  const service = new InventoryService(model);
  const controller = new InventoryController(service);
  const routes = createInventoryRoutes(controller);

  app.use(routes);

  app.listen(3006, () => {
    console.log('inventory-service listening on port 3006');
  });
}

start().catch((error) => {
  console.error('inventory-service failed to start:', error);
  process.exit(1);
});