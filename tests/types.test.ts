import { describe, it, expectTypeOf, assertType } from 'vitest';
import { z } from 'zod';
import type { FastifyRequest } from 'fastify';
import { createRouter } from '../src/core/http/router.js';
import type {
  InferBody,
  InferParams,
  InferQuery,
  InferHeaders,
  InferSchema,
  TypedRequestContext,
  TypedRouteHandler,
} from '../src/core/http/types.js';

describe('Typed Route Schema — Foundation Types', () => {
  const userSchema = {
    body: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
  } as const;

  const paramsSchema = {
    params: z.object({
      id: z.string().uuid(),
    }),
  } as const;

  const querySchema = {
    querystring: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
    }),
  } as const;

  const headersSchema = {
    headers: z.object({
      authorization: z.string(),
    }),
  } as const;

  const fullSchema = {
    body: z.object({ name: z.string() }),
    params: z.object({ id: z.string() }),
    querystring: z.object({ page: z.number() }),
    headers: z.object({ authorization: z.string() }),
  } as const;

  describe('InferBody', () => {
    it('infers body type from schema', () => {
      type Body = InferBody<typeof userSchema>;
      expectTypeOf<Body>().toEqualTypeOf<{ name: string; email: string }>();
    });

    it('returns unknown when body is not defined', () => {
      type Body = InferBody<typeof paramsSchema>;
      expectTypeOf<Body>().toEqualTypeOf<unknown>();
    });
  });

  describe('InferParams', () => {
    it('infers params type from schema', () => {
      type Params = InferParams<typeof paramsSchema>;
      expectTypeOf<Params>().toEqualTypeOf<{ id: string }>();
    });

    it('returns unknown when params is not defined', () => {
      type Params = InferParams<typeof userSchema>;
      expectTypeOf<Params>().toEqualTypeOf<unknown>();
    });
  });

  describe('InferQuery', () => {
    it('infers querystring type from schema', () => {
      type Query = InferQuery<typeof querySchema>;
      expectTypeOf<Query>().toEqualTypeOf<{ page: number; limit: number }>();
    });

    it('returns unknown when querystring is not defined', () => {
      type Query = InferQuery<typeof userSchema>;
      expectTypeOf<Query>().toEqualTypeOf<unknown>();
    });
  });

  describe('InferHeaders', () => {
    it('infers headers type from schema', () => {
      type Headers = InferHeaders<typeof headersSchema>;
      expectTypeOf<Headers>().toEqualTypeOf<{ authorization: string }>();
    });

    it('returns FastifyRequest headers when headers is not defined in schema', () => {
      type Headers = InferHeaders<typeof userSchema>;
      expectTypeOf<Headers>().toEqualTypeOf<FastifyRequest['headers']>();
    });
  });

  describe('InferSchema', () => {
    it('infers all types from a full schema', () => {
      type Schema = InferSchema<typeof fullSchema>;
      expectTypeOf<Schema['body']>().toEqualTypeOf<{ name: string }>();
      expectTypeOf<Schema['params']>().toEqualTypeOf<{ id: string }>();
      expectTypeOf<Schema['query']>().toEqualTypeOf<{ page: number }>();
      expectTypeOf<Schema['headers']>().toEqualTypeOf<{ authorization: string }>();
    });
  });

  describe('TypedRequestContext', () => {
    it('provides typed request.body in the context', () => {
      type Ctx = TypedRequestContext<typeof userSchema>;
      expectTypeOf<Ctx['request']['body']>().toEqualTypeOf<{ name: string; email: string }>();
    });

    it('provides typed request.params in the context', () => {
      type Ctx = TypedRequestContext<typeof paramsSchema>;
      expectTypeOf<Ctx['request']['params']>().toEqualTypeOf<{ id: string }>();
    });

    it('provides typed request.query in the context', () => {
      type Ctx = TypedRequestContext<typeof querySchema>;
      expectTypeOf<Ctx['request']['query']>().toEqualTypeOf<{ page: number; limit: number }>();
    });
  });

  describe('TypedRouteHandler', () => {
    it('handler receives typed context', () => {
      const handler: TypedRouteHandler<typeof userSchema> = (ctx) => {
        assertType<{ name: string; email: string }>(ctx.request.body);
        return ctx.request.body.name;
      };
      expectTypeOf(handler).toBeFunction();
    });
  });

  describe('Typed Router', () => {
    it('infers body type in handler when schema is provided', () => {
      const router = createRouter();

      router.post('/', {
        schema: { body: z.object({ name: z.string(), email: z.string().email() }) },
        handler: (ctx) => {
          assertType<string>(ctx.request.body.name);
          assertType<string>(ctx.request.body.email);
          return ctx.request.body;
        },
      });
    });

    it('infers params type in handler when schema is provided', () => {
      const router = createRouter();

      router.get('/:id', {
        schema: { params: z.object({ id: z.string() }) },
        handler: (ctx) => {
          assertType<string>(ctx.request.params.id);
          return ctx.request.params;
        },
      });
    });

    it('infers querystring type in handler when schema is provided', () => {
      const router = createRouter();

      router.get('/search', {
        schema: { querystring: z.object({ q: z.string(), page: z.number() }) },
        handler: (ctx) => {
          assertType<string>(ctx.request.query.q);
          assertType<number>(ctx.request.query.page);
          return ctx.request.query;
        },
      });
    });

    it('works without schema (backwards compatibility)', () => {
      const router = createRouter();

      router.get('/ping', {
        handler: (ctx) => {
          // Without schema, request is typed as the base typed request with all unknown
          return { pong: true };
        },
      });
    });

    it('works with container in typed routes', () => {
      const router = createRouter();

      router.post('/users', {
        schema: { body: z.object({ name: z.string() }) },
        handler: (ctx) => {
          assertType<string>(ctx.request.body.name);
          // container should still be available
          const container = ctx.container;
          return { name: ctx.request.body.name };
        },
      });
    });

    it('supports all HTTP methods with typed schema', () => {
      const router = createRouter();
      const schema = { body: z.object({ value: z.number() }) };

      router.put('/resource', {
        schema,
        handler: (ctx) => {
          assertType<number>(ctx.request.body.value);
          return ctx.request.body;
        },
      });

      router.patch('/resource', {
        schema,
        handler: (ctx) => {
          assertType<number>(ctx.request.body.value);
          return ctx.request.body;
        },
      });

      router.delete('/resource', {
        schema: { params: z.object({ id: z.string() }) },
        handler: (ctx) => {
          assertType<string>(ctx.request.params.id);
          return { deleted: true };
        },
      });
    });
  });
});
