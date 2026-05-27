import type { Provider } from '../container/container.js';
import type { RouterDefinition, RouteMiddleware } from './router.js';
import type { JobDefinition } from '../jobs/job.js';
import type { EventHandler } from '../events/event-bus.js';
import type { RetryOptions } from '../resilience/retry.js';

export type EventModuleDefinition = {
  event: string;
  handler: EventHandler | string | symbol | Function;
  resilience?: {
    retry?: RetryOptions;
  };
};

export type ModuleDefinition = {
  name: string;
  prefix?: string;
  routes?: RouterDefinition;
  providers?: Provider[];
  middlewares?: RouteMiddleware[];
  jobs?: JobDefinition[];
  events?: EventModuleDefinition[];
  i18n?: Record<string, any>;
};

export const defineModule = (definition: ModuleDefinition) => definition;
