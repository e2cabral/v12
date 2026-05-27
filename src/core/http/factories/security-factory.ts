import type { FastifyInstance } from 'fastify';
import cors, { type FastifyCorsOptions } from '@fastify/cors';
import helmet, { type FastifyHelmetOptions } from '@fastify/helmet';
import cookie, { type FastifyCookieOptions } from '@fastify/cookie';

export type SecurityOptions = {
  cors?: boolean | FastifyCorsOptions;
  helmet?: boolean | FastifyHelmetOptions;
  cookie?: boolean | FastifyCookieOptions;
};

export async function initSecurity(app: FastifyInstance, security: SecurityOptions) {
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
}
