import type { ServiceName } from '../../shared/src/types.js';

export type ServiceConfig = {
  name: ServiceName;
  port: number;
};