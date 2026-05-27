import { createApp, type CreateAppOptions } from '../http/app.js';
import type { ModuleDefinition } from '../http/module.js';
import type { Provider } from '../container/container.js';

export type CreateTestingAppOptions = {
  modules?: ModuleDefinition[];
  overrides?: Provider[];
} & Omit<CreateAppOptions, 'modules' | 'providers'>;

export const createTestingApp = async ({
  modules = [],
  overrides = [],
  ...rest
}: CreateTestingAppOptions = {}) =>
  createApp({
    ...rest,
    modules,
    providers: overrides,
    fastify: {
      logger: false,
      ...(rest.fastify ?? {}),
    },
  });
