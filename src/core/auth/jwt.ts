import { createHmac, timingSafeEqual } from 'node:crypto';
import { UnauthorizedError } from '../errors/app-error.js';

export type JwtPayload = Record<string, unknown> & {
  sub?: string;
  role?: string;
  iat?: number;
  exp?: number;
};

export type JwtOptions = {
  secret: string;
  expiresInSeconds?: number;
  refreshTokenExpiresInSeconds?: number;
  cookieName?: string;
};

const encode = (value: string) => Buffer.from(value).toString('base64url');
const decode = (value: string) => Buffer.from(value, 'base64url').toString('utf8');

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

export const signTokens = (
  payload: JwtPayload,
  options: JwtOptions,
): AuthTokens => {
  const accessToken = signJwt(payload, options);
  let refreshToken: string | undefined;

  if (options.refreshTokenExpiresInSeconds) {
    refreshToken = signJwt(payload, {
      ...options,
      expiresInSeconds: options.refreshTokenExpiresInSeconds,
    });
  }

  return { accessToken, refreshToken };
};

export const signJwt = (payload: JwtPayload, options: JwtOptions) => {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const fullPayload: JwtPayload = {
    iat: now,
    ...(options.expiresInSeconds ? { exp: now + options.expiresInSeconds } : {}),
    ...payload,
  };

  const encodedHeader = encode(JSON.stringify(header));
  const encodedPayload = encode(JSON.stringify(fullPayload));
  const signature = createHmac('sha256', options.secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const verifyJwt = (token: string, options: JwtOptions): JwtPayload => {
  const [encodedHeader, encodedPayload, signature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new UnauthorizedError('Invalid token');
  }

  const expectedSignature = createHmac('sha256', options.secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  const validSignature = timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );

  if (!validSignature) {
    throw new UnauthorizedError('Invalid token');
  }

  const payload = JSON.parse(decode(encodedPayload)) as JwtPayload;
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) {
    throw new UnauthorizedError('Token expired');
  }

  return payload;
};

export const extractBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError();
  }

  return authorizationHeader.slice('Bearer '.length);
};
