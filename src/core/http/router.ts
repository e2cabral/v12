import type { FastifyReply, FastifyRequest } from 'fastify';
import { validateSchema, type RouteSchema } from '../validation/schema.js';
import type { Container } from '../container/container.js';
import { withRetry, type RetryOptions } from '../resilience/retry.js';
import { CircuitBreaker, type CircuitBreakerOptions } from '../resilience/circuit-breaker.js';
import { withTimeout, type TimeoutOptions } from '../resilience/timeout.js';
import { withFallback, type FallbackOptions } from '../resilience/fallback.js';
import { withBulkhead, type BulkheadOptions } from '../resilience/bulkhead.js';

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

export const createRouter = (prefix?: string) => {
  const routes: RouteDefinition[] = [];

  return {
    prefix,
    routes,
    get: (path: string, definition: Omit<RouteDefinition, 'method' | 'path'>) =>
      routes.push(createRouteBuilder('GET')(path, definition)),
    post: (path: string, definition: Omit<RouteDefinition, 'method' | 'path'>) =>
      routes.push(createRouteBuilder('POST')(path, definition)),
    put: (path: string, definition: Omit<RouteDefinition, 'method' | 'path'>) =>
      routes.push(createRouteBuilder('PUT')(path, definition)),
    patch: (path: string, definition: Omit<RouteDefinition, 'method' | 'path'>) =>
      routes.push(createRouteBuilder('PATCH')(path, definition)),
    delete: (path: string, definition: Omit<RouteDefinition, 'method' | 'path'>) =>
      routes.push(createRouteBuilder('DELETE')(path, definition)),
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
