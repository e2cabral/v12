import { createApp, type CreateAppOptions } from '../http/app.js';
import type { ModuleDefinition } from '../http/module.js';
import type { Provider } from '../container/container.js';

export type CreateTestingAppOptions = {
  modules?: ModuleDefinition[];
  overrides?: Provider[];
} & Omit<CreateAppOptions, 'modules' | 'providers'>;

/**
 * Cria uma instância da aplicação configurada para testes — sem logs, sem shutdown, com overrides de DI.
 *
 * @param options - Configuração de teste incluindo módulos e providers de override.
 * @returns Uma AppInstance pronta para testes de integração.
 *
 * @example
 * ```ts
 * const app = await createTestingApp({
 *   modules: [UsersModule],
 *   overrides: [{ provide: DB, useValue: mockDb }],
 * });
 * const res = await app.inject({ method: 'GET', url: '/users' });
 * ```
 */
export const createTestingApp = async ({
  modules = [],
  overrides = [],
  ...rest
}: CreateTestingAppOptions = {}) =>
  createApp({
    ...rest,
    modules,
    providers: overrides,
    shutdown: false,
    fastify: {
      logger: false,
      ...(rest.fastify ?? {}),
    },
  });
