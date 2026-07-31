import type { FastifyReply, FastifyRequest } from 'fastify';
import { validateSchema, type RouteSchema } from '../validation/schema.js';
import type { Container } from '../container/container.js';
import { withRetry, type RetryOptions } from '../resilience/retry.js';
import { CircuitBreaker, type CircuitBreakerOptions } from '../resilience/circuit-breaker.js';
import { withTimeout, type TimeoutOptions } from '../resilience/timeout.js';
import { withFallback, type FallbackOptions } from '../resilience/fallback.js';
import { withBulkhead, type BulkheadOptions } from '../resilience/bulkhead.js';
import type { TypedRequestContext, TypedRouteSchema } from './types.js';

/**
 * Contexto de requisição passado para handlers e middlewares de rota.
 *
 * @example
 * ```ts
 * router.get('/', {
 *   handler: ({ container, request }) => {
 *     return container.resolve(MyService).handle(request.body);
 *   },
 * });
 * ```
 */
export type RequestContext = {
  request: FastifyRequest;
  reply: FastifyReply;
  container: Container;
  connection?: any;
  t: (key: string, args?: Record<string, any>) => string;
  signal?: AbortSignal;
};

export type RouteHandler = (context: RequestContext) => Promise<unknown> | unknown;
export type RouteMiddleware = (context: RequestContext) => Promise<void> | void;

export type RouteResilience = {
  retry?: RetryOptions;
  circuitBreaker?: CircuitBreakerOptions;
  timeout?: TimeoutOptions;
  bulkhead?: BulkheadOptions & { identifier?: string };
  fallback?: FallbackOptions<any>;
};

/**
 * Definição completa de uma rota HTTP no V12.
 *
 * @example
 * ```ts
 * const route: RouteDefinition = {
 *   method: 'POST',
 *   path: '/users',
 *   schema: { body: createUserSchema },
 *   handler: ({ container }) => container.resolve(UsersController).create(),
 * };
 * ```
 */
export type RouteDefinition = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  version?: string;
  schema?: RouteSchema;
  middlewares?: RouteMiddleware[];
  handler: RouteHandler;
  websocket?: boolean;
  resilience?: RouteResilience;
};

/**
 * A typed route configuration that infers handler context from the schema.
 * When a schema is provided, the handler receives a TypedRequestContext
 * with properly typed request.body, request.params, request.query, and request.headers.
 */
export type TypedRouteConfig<S extends TypedRouteSchema> = {
  version?: string;
  schema?: S;
  middlewares?: RouteMiddleware[];
  handler: (context: TypedRequestContext<S>) => Promise<unknown> | unknown;
  websocket?: boolean;
  resilience?: RouteResilience;
};

export type RouterDefinition = {
  prefix?: string;
  routes: RouteDefinition[];
};

const createRouteBuilder = (method: RouteDefinition['method']) => {
  return (path: string, definition: Omit<RouteDefinition, 'method' | 'path'>): RouteDefinition => ({
    method,
    path,
    ...definition,
  });
};

/**
 * Cria um router fluente para declaração de rotas HTTP.
 *
 * @param prefix - Prefixo opcional aplicado a todas as rotas do router.
 * @returns Um builder com métodos get/post/put/patch/delete e build().
 *
 * @example
 * ```ts
 * const router = createRouter();
 * router.get('/', { handler: ({ container }) => container.resolve(Ctrl).list() });
 * const UsersModule = defineModule({ name: 'users', routes: router.build() });
 * ```
 */
export const createRouter = (prefix?: string) => {
  const routes: RouteDefinition[] = [];

  const addRoute = <S extends TypedRouteSchema>(
    method: RouteDefinition['method'],
    path: string,
    definition: TypedRouteConfig<S>,
  ) => {
    return routes.push(
      createRouteBuilder(method)(path, definition as unknown as Omit<RouteDefinition, 'method' | 'path'>),
    );
  };

  return {
    prefix,
    routes,
    get: <S extends TypedRouteSchema>(path: string, definition: TypedRouteConfig<S>) =>
      addRoute('GET', path, definition),
    post: <S extends TypedRouteSchema>(path: string, definition: TypedRouteConfig<S>) =>
      addRoute('POST', path, definition),
    put: <S extends TypedRouteSchema>(path: string, definition: TypedRouteConfig<S>) =>
      addRoute('PUT', path, definition),
    patch: <S extends TypedRouteSchema>(path: string, definition: TypedRouteConfig<S>) =>
      addRoute('PATCH', path, definition),
    delete: <S extends TypedRouteSchema>(path: string, definition: TypedRouteConfig<S>) =>
      addRoute('DELETE', path, definition),
    build(): RouterDefinition {
      return { prefix, routes };
    },
  };
};

export const composeResilience = (
  route: RouteDefinition,
  redis?: any,
): ((context: RequestContext) => Promise<any>) => {
  let pipeline = (context: RequestContext) =>
    Promise.resolve(route.handler(context));

  if (!route.resilience) return pipeline;

  const { retry, circuitBreaker, bulkhead, timeout, fallback } =
    route.resilience;

  if (retry) {
    const next = pipeline;
    pipeline = (context) => withRetry(() => next(context), retry);
  }

  if (circuitBreaker) {
    const cb = getCircuitBreaker(route, redis);
    const next = pipeline;
    pipeline = (context) => cb.execute(() => next(context));
  }

  if (bulkhead) {
    const identifier = bulkhead.identifier || `${route.method}:${route.path}`;
    const next = pipeline;
    pipeline = (context) =>
      withBulkhead(identifier, () => next(context), bulkhead);
  }

  if (timeout) {
    const next = pipeline;
    pipeline = (context) =>
      withTimeout((signal) => {
        context.signal = signal;
        return next(context);
      }, timeout);
  }

  if (fallback) {
    const next = pipeline;
    pipeline = (context) => withFallback(() => next(context), fallback);
  }

  return pipeline;
};

export const runRoute = async (
  route: RouteDefinition,
  context: RequestContext,
  pipeline?: (context: RequestContext) => Promise<any>,
) => {
  const request = context.request as FastifyRequest & {
    body: unknown;
    params: unknown;
    query: unknown;
    headers: Record<string, string | string[] | undefined>;
  };

  if (route.schema?.body) {
    request.body = validateSchema(route.schema.body, request.body);
  }

  if (route.schema?.params) {
    request.params = validateSchema(route.schema.params, request.params);
  }

  if (route.schema?.querystring) {
    request.query = validateSchema(route.schema.querystring, request.query);
  }

  if (route.schema?.headers) {
    request.headers = validateSchema(
      route.schema.headers,
      request.headers,
    ) as Record<string, string | string[] | undefined>;
  }

  for (const middleware of route.middlewares ?? []) {
    await middleware(context);
  }

  const effectivePipeline = pipeline || composeResilience(route);
  return effectivePipeline(context);
};

const cbCache = new Map<string, CircuitBreaker>();
const getCircuitBreaker = (
  route: RouteDefinition,
  redis?: any,
): CircuitBreaker => {
  const key = `${route.method}:${route.path}`;
  if (!cbCache.has(key)) {
    const options = { ...route.resilience?.circuitBreaker };
    if (redis) {
      options.redis = { client: redis, key: `cb:${key}` };
    }
    cbCache.set(key, new CircuitBreaker(options));
  }
  return cbCache.get(key)!;
};
