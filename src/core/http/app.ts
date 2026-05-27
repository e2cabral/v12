import { randomUUID } from 'node:crypto';
import Fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
  type FastifyServerOptions,
} from 'fastify';
import redisPlugin, { type FastifyRedisPluginOptions } from '@fastify/redis';
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
import { getWelcomePage } from './welcome-page.js';
import { initSecurity } from './factories/security-factory.js';
import { initTelemetry } from './factories/telemetry-factory.js';
import { initContainer } from './factories/container-factory.js';
import { PluginRegistry } from './plugin-registry.js';

export type CreateAppOptions = {
  modules?: ModuleDefinition[];
  providers?: Provider[];
  middlewares?: RouteMiddleware[];
  plugins?: V12Plugin[];
  fastify?: FastifyServerOptions;
  security?: {
    cors?: boolean | FastifyCorsOptions;
    helmet?: boolean | FastifyHelmetOptions;
    bodyLimit?: number;
    requestTimeout?: number;
    cookie?: boolean | FastifyCookieOptions;
  };
  redis?: boolean | FastifyRedisPluginOptions;
  upload?: boolean | any;
  websocket?: boolean | any;
  i18n?: I18nOptions;
  telemetry?: TelemetryOptions;
};

export type AppInstance = FastifyInstance & {
  container: Container;
  events: EventBus;
  modules: ModuleDefinition[];
  telemetry?: Telemetry;
  use: (plugin: V12Plugin) => Promise<AppInstance>;
};

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

  const metrics = {
    requestsTotal: 0,
    errorsTotal: 0,
  };

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
    metrics.requestsTotal++;
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
    if (reply.statusCode >= 400) {
      metrics.errorsTotal++;
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
    metrics.errorsTotal++;
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

  app.get('/metrics', async (_request, reply) =>
    reply.type('text/plain').send(
      [
        `v12_requests_total ${metrics.requestsTotal}`,
        `v12_errors_total ${metrics.errorsTotal}`,
        `v12_uptime_seconds ${process.uptime()}`,
      ].join('\n'),
    ),
  );

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
