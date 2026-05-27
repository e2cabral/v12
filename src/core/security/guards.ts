import { UnauthorizedError, ForbiddenError } from '../errors/app-error.js';
import type { RouteMiddleware } from '../http/router.js';
import { extractBearerToken, verifyJwt, type JwtOptions } from '../auth/jwt.js';
import { verifyApiKey, type ApiKeyOptions } from '../auth/api-key.js';

export const auth = (): RouteMiddleware => ({ request }) => {
  if (!request.headers.authorization) {
    throw new UnauthorizedError();
  }
};

export const jwt = (options: JwtOptions): RouteMiddleware => ({ request }) => {
  let token: string;

  if (options.cookieName && (request as any).cookies?.[options.cookieName]) {
    token = (request as any).cookies[options.cookieName];
  } else {
    token = extractBearerToken(request.headers.authorization);
  }

  const payload = verifyJwt(token, options);
  Object.assign(request, { auth: payload });
};

export const apiKey = (options: ApiKeyOptions): RouteMiddleware => ({ request }) => {
  verifyApiKey(
    request.headers as Record<string, string | string[] | undefined>,
    options,
  );
};

export const role = (expectedRoles: string | string[]): RouteMiddleware => ({ request }) => {
  const roles = Array.isArray(expectedRoles) ? expectedRoles : [expectedRoles];
  const currentRole =
    (request as FastifyRequestWithAuth).auth?.role ?? (request.headers['x-role'] as string);

  if (!roles.includes(currentRole)) {
    throw new ForbiddenError('Insufficient permissions');
  }
};

export type PolicyHandler = (context: { request: any; container: any }) => boolean | Promise<boolean>;

export const policy = (handler: PolicyHandler): RouteMiddleware => async ({ request, container }) => {
  const allowed = await handler({ request, container });
  if (!allowed) {
    throw new ForbiddenError('Policy violation');
  }
};

type FastifyRequestWithAuth = {
  auth?: {
    role?: string;
  };
  headers: Record<string, string | string[] | undefined>;
};
