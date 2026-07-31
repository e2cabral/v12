import { randomUUID } from 'node:crypto';
import Fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
  type FastifyServerOptions,
} from 'fastify';
import redisPlugin, { type FastifyRedisPluginOptions } from '@fastify/redis';
import type { FastifyCorsOptions } from '@fastify/cors';
import type { FastifyHelmetOptions } from '@fastify/helmet';
import type { FastifyCookieOptions } from '@fastify/cookie';
import multipart from '@fastify/multipart';
import websocket from '@fastify/websocket';
import { AppError, ValidationError } from '../errors/app-error.js';
import { fail, ok } from './response.js';
import type { Container, Provider } from '../container/container.js';
import { getLoggerOptions } from '../logger/logger.js';
import type { EventBus } from '../events/event-bus.js';
import { EventRegistry } from '../events/registry.js';
import type { ModuleDefinition } from './module.js';
import {
  runRoute,
  composeResilience,
  type RouteMiddleware,
  type RequestContext,
} from './router.js';
import { createRequestContext } from './context.js';
import type { V12Plugin } from './plugin.js';
import type { I18nOptions } from '../i18n/i18n.js';
import { registerDevTools } from '../devtools/devtools.js';
import { Telemetry, type TelemetryOptions } from '../telemetry/otel.js';
import { MetricsRegistry, Gauge } from '../telemetry/metrics.js';
import { getWelcomePage } from './welcome-page.js';
import { initSecurity } from './factories/security-factory.js';
import { initTelemetry } from './factories/telemetry-factory.js';
import { initContainer } from './factories/container-factory.js';
import { PluginRegistry } from './plugin-registry.js';
import { setupGracefulShutdown, type ShutdownOptions } from './shutdown.js';

/**
 * Configuration options for creating a V12 application instance.
 *
 * @example
 * ```ts
 * const options: CreateAppOptions = {
 *   modules: [UsersModule],
 *   security: { cors: true, helmet: true },
 * };
 * ```
 */
export type CreateAppOptions = {
  /** Módulos de feature a serem registrados na aplicação. */
  modules?: ModuleDefinition[];
  /** Providers globais disponíveis em todos os módulos. */
  providers?: Provider[];
  /** Middlewares globais executados em todas as rotas. */
  middlewares?: RouteMiddleware[];
  /** Plugins V12 a serem registrados durante o bootstrap. */
  plugins?: V12Plugin[];
  /** Opções nativas do Fastify (logger, bodyLimit, etc). */
  fastify?: FastifyServerOptions;
  /** Configurações de segurança (CORS, Helmet, cookies, limites). */
  security?: {
    cors?: boolean | FastifyCorsOptions;
    helmet?: boolean | FastifyHelmetOptions;
    bodyLimit?: number;
    requestTimeout?: number;
    cookie?: boolean | FastifyCookieOptions;
  };
  /** Configuração do Redis (true para padrão, ou opções customizadas). */
  redis?: boolean | FastifyRedisPluginOptions;
  /** Habilita upload de arquivos via multipart. */
  upload?: boolean | any;
  /** Habilita suporte a WebSocket. */
  websocket?: boolean | any;
  /** Opções de internacionalização (i18n). */
  i18n?: I18nOptions;
  /** Configuração de telemetria e OpenTelemetry. */
  telemetry?: TelemetryOptions;
  /** Configuração de graceful shutdown. */
  shutdown?: ShutdownOptions | boolean;
};

/**
 * Instância da aplicação V12 — estende FastifyInstance com DI, eventos e plugins.
 *
 * @example
 * ```ts
 * const app = await createApp({ modules: [PingModule] });
 * app.container.resolve(MyService);
 * ```
 */
export type AppInstance = FastifyInstance & {
  container: Container;
  events: EventBus;
  modules: ModuleDefinition[];
  telemetry?: Telemetry;
  shutdown: () => Promise<void>;
  use: (plugin: V12Plugin) => Promise<AppInstance>;
};

/**
 * Creates a new V12 application instance with the given configuration.
 *
 * @param options - Application configuration including modules, plugins, and security settings.
 * @returns A configured Fastify instance extended with V12 features.
 *
 * @example
 * ```ts
 * const app = await createApp({
 *   modules: [UsersModule],
 *   security: { cors: true },
 * });
 * await app.listen({ port: 3000 });
 * ```
 */
export const createApp = async ({
  modules = [],
  providers = [],
  middlewares = [],
  plugins = [],
  fastify,
  security = {},
  redis,
  upload,
  websocket: websocketOption,
  i18n: i18nOptions,
  telemetry: telemetryOptions,
  shutdown: shutdownOption,
}: CreateAppOptions = {}): Promise<AppInstance> => {
  const app = Fastify({
    ...fastify,
    logger: fastify?.logger ?? getLoggerOptions(),
    bodyLimit: security.bodyLimit ?? fastify?.bodyLimit,
    connectionTimeout: security.requestTimeout ?? fastify?.connectionTimeout,
  }) as unknown as AppInstance;

  const logger = app.log;

  // 1. Initialize Telemetry
  await initTelemetry(app, telemetryOptions);

  // 2. Initialize Security (CORS, Helmet, etc)
  await initSecurity(app, security);

  // 3. Register global plugins (Redis, Multipart, WebSocket)
  if (redis) {
    await app.register(
      redisPlugin,
      typeof redis === 'object' ? redis : { url: 'redis://localhost:6379' },
    );
  }

  if (upload) {
    await app.register(
      multipart,
      typeof upload === 'object' ? (upload as any) : {},
    );
  }

  if (websocketOption) {
    await app.register(
      websocket,
      typeof websocketOption === 'object' ? (websocketOption as any) : {},
    );
  }

  // 4. Initialize Container, EventBus, I18n
  const { container, events, i18nService } = initContainer({
    modules,
    providers,
    logger,
    i18nOptions,
    redis: redis ? (app as any).redis : null,
  });

  app.decorateRequest('v12', null);

  app.addHook('onRequest', async (request, reply) => {
    (request as any).v12 = createRequestContext(
      request,
      reply,
      container,
      i18nService,
    );
  });

  const metricsRegistry = new MetricsRegistry();
  const httpRequestsTotal = metricsRegistry.createCounter(
    'http_requests_total',
    'Total number of HTTP requests',
  );
  const httpRequestDuration = metricsRegistry.createHistogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
  );
  const httpErrorsTotal = metricsRegistry.createCounter(
    'http_errors_total',
    'Total number of HTTP errors',
  );

  const pluginRegistry = new PluginRegistry(app);
  const eventRegistry = new EventRegistry(events, container);

  app.decorate('container', container);
  app.decorate('events', events);
  app.decorate('modules', modules);

  app.decorate('use', async function use(plugin: V12Plugin, config?: any) {
    await pluginRegistry.register(plugin, config);
    return app;
  });

  app.addHook('onReady', async () => {
    await pluginRegistry.triggerReady();
  });

  app.addHook('onRequest', async (request) => {
    (request as any).__startTime = process.hrtime.bigint();
    const headers = request.headers as Record<string, string | string[] | undefined>;
    headers['x-request-id'] ??= randomUUID();
  });

  app.addHook('onSend', async (request, reply) => {
    const requestId = request.headers['x-request-id'];
    if (requestId) {
      reply.header('x-request-id', requestId);
    }
  });

  app.addHook('onResponse', async (request, reply) => {
    const path = (request.routeOptions as any)?.url || request.url;
    const method = request.method;
    const status = String(reply.statusCode);

    httpRequestsTotal.inc({ method, path, status });

    if (reply.statusCode >= 400) {
      httpErrorsTotal.inc({ method, path, status });
    }

    const startTime = (request as any).__startTime as bigint | undefined;
    if (startTime) {
      const duration = Number(process.hrtime.bigint() - startTime) / 1e9;
      httpRequestDuration.observe({ method, path }, duration);
    }

    app.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration: `${reply.elapsedTime.toFixed(2)}ms`,
        requestId: request.headers['x-request-id'],
      },
      'Request completed',
    );
  });

  app.setErrorHandler((error: any, _request, reply) => {
    if (error instanceof AppError) {
      return fail(reply, error.code, error.message, error.statusCode, error.details);
    }

    if (isFastifyValidationError(error)) {
      const validationError = new ValidationError('Validation failed', error.validation);
      return fail(
        reply,
        validationError.code,
        validationError.message,
        validationError.statusCode,
        validationError.details,
      );
    }

    if (error.statusCode) {
      return fail(reply, error.code || 'REQUEST_ERROR', error.message, error.statusCode);
    }

    requestSafeLog(app, error);
    return fail(reply, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  });

  registerDevTools(app);

  app.get('/', async (request, reply) => {
    if (request.headers.accept?.includes('text/html')) {
      reply
        .type('text/html')
        .send(getWelcomePage('1.0.0', process.env.NODE_ENV || 'development'));
      return;
    }

    return ok(reply, {
      message: 'Welcome to V12 Framework',
      version: '1.0.0',
      docs: '/docs',
      devtools: '/_v12/devtools',
      health: '/health',
      metrics: '/metrics',
    });
  });

  app.get('/health', async (_request, reply) =>
    ok(reply, {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      node: process.version,
    }),
  );

  app.get('/metrics', async (_request, reply) => {
    const uptimeGauge = new Gauge(
      'process_uptime_seconds',
      'Process uptime in seconds',
    );
    uptimeGauge.set({}, process.uptime());

    const heapGauge = new Gauge(
      'nodejs_heap_bytes',
      'Node.js heap memory usage in bytes',
    );
    const mem = process.memoryUsage();
    heapGauge.set({ space: 'rss' }, mem.rss);
    heapGauge.set({ space: 'heap_total' }, mem.heapTotal);
    heapGauge.set({ space: 'heap_used' }, mem.heapUsed);
    heapGauge.set({ space: 'external' }, mem.external);

    const output = [
      metricsRegistry.serialize(),
      uptimeGauge.serialize(),
      heapGauge.serialize(),
    ].join('\n');

    return reply.type('text/plain; charset=utf-8').send(output);
  });

  for (const plugin of plugins) {
    await app.use(plugin);
  }

  for (const module of modules) {
    if (module.events) {
      eventRegistry.register(module.events);
    }

    const prefix = [module.prefix ?? `/${module.name}`, module.routes?.prefix]
      .filter(Boolean)
      .join('');

    for (const route of module.routes?.routes ?? []) {
      const url = `${prefix}${route.path}`;
      const pipeline = composeResilience(route, (app as any).redis);

      const routeOptions: any = {
        method: route.method,
        url,
        config: {
          version: route.version,
          module: module.name,
        },
        preHandler: async (request: FastifyRequest) => {
          const context = (request as any).v12;
          for (const middleware of middlewares) {
            await middleware(context);
          }
          for (const middleware of module.middlewares ?? []) {
            await middleware(context);
          }
        },
      };

      if (route.websocket) {
        routeOptions.websocket = true;
        routeOptions.handler = async (
          connection: any,
          request: FastifyRequest,
        ) => {
          const context = (request as any).v12;
          context.connection = connection;

          try {
            await route.handler(context);
          } catch (error) {
            app.log.error(error, 'WebSocket handler error');
            const socket = connection.socket || connection;
            if (socket && typeof socket.close === 'function') {
              socket.close();
            }
          }
        };
      } else {
        routeOptions.handler = async (
          request: FastifyRequest,
          reply: FastifyReply,
        ) => {
          const context = (request as any).v12;

          const result = await runRoute(route, context, pipeline);
          if (reply.sent) {
            return reply;
          }

          return ok(reply, result);
        };
      }

      app.route(routeOptions);
    }
  }

  // Setup graceful shutdown
  const shutdownOpts: ShutdownOptions =
    shutdownOption === false
      ? { enabled: false }
      : shutdownOption === true || shutdownOption === undefined
        ? {}
        : shutdownOption;

  setupGracefulShutdown(app, shutdownOpts);

  return app;
};

const requestSafeLog = (app: FastifyInstance, error: unknown) => {
  app.log.error({ err: error }, 'Unhandled application error');
};

const isFastifyValidationError = (
  error: unknown,
): error is { validation: unknown } =>
  typeof error === 'object' &&
  error !== null &&
  'validation' in error;
