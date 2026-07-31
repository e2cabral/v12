import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z, ZodTypeAny } from 'zod';
import type { Container } from '../container/container.js';
import type { RouteSchema } from '../validation/schema.js';

/**
 * A route schema type that preserves the specific Zod types for inference.
 * Use this when defining schemas inline or as `const` for full type inference.
 */
export type TypedRouteSchema = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  querystring?: ZodTypeAny;
  headers?: ZodTypeAny;
  response?: ZodTypeAny;
};

/**
 * Infers the parsed body type from a route schema.
 *
 * @example
 * ```ts
 * const schema = { body: z.object({ name: z.string() }) };
 * type Body = InferBody<typeof schema>; // { name: string }
 * ```
 */
export type InferBody<S extends TypedRouteSchema> = S extends { body: infer B }
  ? B extends ZodTypeAny
    ? z.infer<B>
    : unknown
  : unknown;

/**
 * Infers the parsed params type from a route schema.
 *
 * @example
 * ```ts
 * const schema = { params: z.object({ id: z.string().uuid() }) };
 * type Params = InferParams<typeof schema>; // { id: string }
 * ```
 */
export type InferParams<S extends TypedRouteSchema> = S extends { params: infer P }
  ? P extends ZodTypeAny
    ? z.infer<P>
    : unknown
  : unknown;

/**
 * Infers the parsed querystring type from a route schema.
 *
 * @example
 * ```ts
 * const schema = { querystring: z.object({ page: z.coerce.number() }) };
 * type Query = InferQuery<typeof schema>; // { page: number }
 * ```
 */
export type InferQuery<S extends TypedRouteSchema> = S extends { querystring: infer Q }
  ? Q extends ZodTypeAny
    ? z.infer<Q>
    : unknown
  : unknown;

/**
 * Infers the parsed headers type from a route schema.
 *
 * @example
 * ```ts
 * const schema = { headers: z.object({ authorization: z.string() }) };
 * type Headers = InferHeaders<typeof schema>; // { authorization: string }
 * ```
 */
export type InferHeaders<S extends TypedRouteSchema> = S extends { headers: infer H }
  ? H extends ZodTypeAny
    ? z.infer<H>
    : FastifyRequest['headers']
  : FastifyRequest['headers'];

/**
 * Infers all parsed types from a route schema as an object.
 */
export type InferSchema<S extends TypedRouteSchema> = {
  body: InferBody<S>;
  params: InferParams<S>;
  query: InferQuery<S>;
  headers: InferHeaders<S>;
};

/**
 * A typed version of FastifyRequest with body/params/query/headers
 * inferred from the route schema.
 */
export type TypedRequest<S extends TypedRouteSchema> = FastifyRequest & {
  body: InferBody<S>;
  params: InferParams<S>;
  query: InferQuery<S>;
  headers: InferHeaders<S>;
};

/**
 * RequestContext with a typed request based on the route schema.
 *
 * @example
 * ```ts
 * const schema = { body: z.object({ name: z.string() }) };
 * router.post('/', {
 *   schema,
 *   handler: (ctx: TypedRequestContext<typeof schema>) => ctx.request.body.name,
 * });
 * ```
 */
export type TypedRequestContext<S extends TypedRouteSchema> = {
  request: TypedRequest<S>;
  reply: FastifyReply;
  container: Container;
  connection?: any;
  t: (key: string, args?: Record<string, any>) => string;
  signal?: AbortSignal;
};

/**
 * A route handler that receives a typed context based on the schema.
 */
export type TypedRouteHandler<S extends TypedRouteSchema> = (
  context: TypedRequestContext<S>,
) => Promise<unknown> | unknown;
