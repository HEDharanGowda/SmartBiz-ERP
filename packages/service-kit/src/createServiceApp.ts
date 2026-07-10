import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import type { Request, Response } from 'express';
import type { ServiceConfig } from './serviceConfig.js';

export function createServiceApp(config: ServiceConfig) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('tiny'));

  app.get('/health', (_request: Request, response: Response) => {
    response.json({ status: 'ok', service: config.name, timestamp: new Date().toISOString() });
  });

  app.get('/ready', (_request: Request, response: Response) => {
    response.json({ status: 'ready', service: config.name, port: config.port });
  });

  return app;
}