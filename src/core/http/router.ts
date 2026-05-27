import type { FastifyReply, FastifyRequest } from 'fastify';
import { validateSchema, type RouteSchema } from '../validation/schema.js';
import type { Container } from '../container/container.js';

export type RequestContext = {
  request: FastifyRequest;
  reply: FastifyReply;
  container: Container;
  connection?: any;
  t: (key: string, args?: Record<string, any>) => string;
};

export type RouteHandler = (context: RequestContext) => Promise<unknown> | unknown;
export type RouteMiddleware = (context: RequestContext) => Promise<void> | void;

export type RouteDefinition = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  version?: string;
  schema?: RouteSchema;
  middlewares?: RouteMiddleware[];
  handler: RouteHandler;
  websocket?: boolean;
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

export const runRoute = async (
  route: RouteDefinition,
  context: RequestContext,
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
    request.query = validateSchema(
      route.schema.querystring,
      request.query,
    );
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

  return route.handler(context);
};
