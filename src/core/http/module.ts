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

/**
 * Definição de um módulo de feature no V12.
 *
 * @example
 * ```ts
 * const mod: ModuleDefinition = {
 *   name: 'users',
 *   providers: [UsersService],
 *   routes: router.build(),
 * };
 * ```
 */
export type ModuleDefinition = {
  /** Nome único do módulo (usado como prefixo de rota padrão). */
  name: string;
  /** Prefixo de rota customizado (substitui `/${name}`). */
  prefix?: string;
  /** Definição de rotas do módulo. */
  routes?: RouterDefinition;
  /** Providers de DI específicos deste módulo. */
  providers?: Provider[];
  /** Middlewares aplicados apenas às rotas deste módulo. */
  middlewares?: RouteMiddleware[];
  /** Jobs agendados definidos neste módulo. */
  jobs?: JobDefinition[];
  /** Handlers de eventos registrados pelo módulo. */
  events?: EventModuleDefinition[];
  /** Traduções i18n fornecidas pelo módulo. */
  i18n?: Record<string, any>;
};

/**
 * Define um módulo de feature no V12.
 *
 * @param definition - Configuração do módulo incluindo nome, providers, rotas e eventos.
 * @returns A definição do módulo pronta para uso em `createApp`.
 *
 * @example
 * ```ts
 * const UsersModule = defineModule({
 *   name: 'users',
 *   providers: [UsersService, UsersController],
 *   routes: router.build(),
 * });
 * ```
 */
export const defineModule = (definition: ModuleDefinition) => definition;
