import { randomUUID } from 'node:crypto';
import Fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
  type FastifyServerOptions,
} from 'fastify';
import cors, { type FastifyCorsOptions } from '@fastify/cors';
import helmet, { type FastifyHelmetOptions } from '@fastify/helmet';
import cookie, { type FastifyCookieOptions } from '@fastify/cookie';
import redisPlugin, { type FastifyRedisPluginOptions } from '@fastify/redis';
import multipart from '@fastify/multipart';
import websocket from '@fastify/websocket';
import { AppError, ValidationError } from '../errors/app-error.js';
import { fail, ok } from './response.js';
import { Container, type Provider } from '../container/container.js';
import { getLoggerOptions } from '../logger/logger.js';
import { EventBus } from '../events/event-bus.js';
import type { ModuleDefinition } from './module.js';
import { runRoute, type RouteMiddleware, type RequestContext } from './router.js';
import type { V12Plugin } from './plugin.js';
import { I18nService, type I18nOptions } from '../i18n/i18n.js';
import { registerDevTools } from '../devtools/devtools.js';
import { Telemetry, type TelemetryOptions } from '../telemetry/otel.js';
import { AuditService } from '../audit/audit-service.js';

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
  if (telemetryOptions?.enabled) {
    const telemetry = new Telemetry(telemetryOptions);
    await telemetry.start();
  }

  const app = Fastify({
    ...fastify,
    logger: fastify?.logger ?? getLoggerOptions(),
    bodyLimit: security.bodyLimit ?? fastify?.bodyLimit,
    connectionTimeout: security.requestTimeout ?? fastify?.connectionTimeout,
  }) as unknown as AppInstance;

  const logger = app.log;

  if (security.cors) {
    await app.register(
      cors,
      typeof security.cors === 'object' ? security.cors : {},
    );
  }

  if (security.helmet) {
    await app.register(
      helmet,
      typeof security.helmet === 'object' ? security.helmet : {},
    );
  }

  if (security.cookie) {
    await app.register(
      cookie,
      typeof security.cookie === 'object' ? security.cookie : {},
    );
  }

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

  const container = new Container();
  const events = new EventBus();
  const i18nService = new I18nService(i18nOptions || { defaultLocale: 'en' });
  const auditService = new AuditService(logger as any);

  // Carregar traduções dos módulos
  for (const module of modules) {
    if (module.i18n) {
      for (const [locale, translations] of Object.entries(module.i18n)) {
        i18nService.addTranslations(locale, translations);
      }
    }
  }

  const metrics = {
    requestsTotal: 0,
    errorsTotal: 0,
  };

  container.registerMany([
    { provide: 'Logger', useValue: logger },
    { provide: 'EventBus', useValue: events },
    { provide: 'I18nService', useValue: i18nService },
    { provide: 'AuditService', useValue: auditService },
    ...(redis ? [{ provide: 'Redis', useValue: (app as any).redis }] : []),
    ...providers,
    ...modules.flatMap((module) => module.providers ?? []),
  ]);

  app.decorate('container', container);
  app.decorate('events', events);
  app.decorate('modules', modules);

  if (telemetryOptions?.enabled) {
    const telemetry = new Telemetry(telemetryOptions);
    app.decorate('telemetry', telemetry);
    
    app.addHook('onClose', async () => {
      await telemetry.stop();
    });
  }

  app.decorate('use', async function use(plugin: V12Plugin) {
    await plugin.register(app);
    return app;
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
      reply.type('text/html').send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>V12 Framework</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; background: #f4f7f6; }
        .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #1a1a1a; margin-top: 0; display: flex; align-items: center; }
        .logo { background: #1a1a1a; color: white; padding: 0.2rem 0.6rem; border-radius: 4px; margin-right: 0.8rem; font-weight: bold; }
        .badge { display: inline-block; background: #e2e8f0; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.875rem; font-weight: 500; }
        ul { list-style: none; padding: 0; }
        li { margin-bottom: 0.5rem; }
        a { color: #2563eb; text-decoration: none; font-weight: 500; }
        a:hover { text-decoration: underline; }
        footer { margin-top: 2rem; font-size: 0.875rem; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <h1><span class="logo">V12</span> Welcome to V12</h1>
        <p>Your feature-driven backend is up and running. V12 is designed for simplicity, cohesion, and speed.</p>
        
        <div style="margin: 1.5rem 0;">
            <span class="badge">Version 1.0.0</span>
            <span class="badge">Environment: ${process.env.NODE_ENV || 'development'}</span>
        </div>

        <h3>Quick Links</h3>
        <ul>
            <li>🚀 <a href="/docs">Interactive API Documentation (Scalar)</a></li>
            <li>🛠️ <a href="/_v12/devtools">V12 DevTools Dashboard</a></li>
            <li>🏥 <a href="/health">System Health Check</a></li>
            <li>📊 <a href="/metrics">Prometheus Metrics</a></li>
        </ul>
    </div>
    <footer>
        Built with V12 Framework &bull; Simplicity by Design
    </footer>
</body>
</html>
      `);
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
    for (const listener of module.events ?? []) {
      events.on(listener.event, listener.handler);
    }

    const prefix = [module.prefix ?? `/${module.name}`, module.routes?.prefix]
      .filter(Boolean)
      .join('');

    for (const route of module.routes?.routes ?? []) {
      const url = `${prefix}${route.path}`;
      const routeOptions: any = {
        method: route.method,
        url,
        config: {
          version: route.version,
          module: module.name,
        },
      };

      if (route.websocket) {
        routeOptions.websocket = true;
        routeOptions.handler = async (
          connection: any,
          request: FastifyRequest,
        ) => {
          const requestContainer = container.createChild();
          const requestLocale =
            (request.query as any)?.lang ||
            request.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
            i18nService.defaultLocale;

          const context: RequestContext = {
            request,
            reply: null as any,
            container: requestContainer,
            connection,
            t: (key: string, args?: Record<string, any>) =>
              i18nService.translate(key, requestLocale as string, args),
          };

          // Executa middlewares básicos (Cuidado: reply não existe aqui)
          try {
            for (const middleware of middlewares) {
              await middleware(context);
            }
            for (const middleware of module.middlewares ?? []) {
              await middleware(context);
            }
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
          const requestContainer = container.createChild();
          const requestLocale =
            (request.query as any)?.lang ||
            request.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
            i18nService.defaultLocale;

          const context: RequestContext = {
            request,
            reply,
            container: requestContainer,
            t: (key: string, args?: Record<string, any>) =>
              i18nService.translate(key, requestLocale as string, args),
          };

          for (const middleware of middlewares) {
            await middleware(context);
          }

          for (const middleware of module.middlewares ?? []) {
            await middleware(context);
          }

          const result = await runRoute(route, context);
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
