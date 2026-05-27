import type { FastifyReply } from 'fastify';
import { signJwt, verifyJwt, signTokens, type JwtOptions, type JwtPayload } from './jwt.js';
import { UnauthorizedError } from '../errors/app-error.js';

export class AuthService {
  constructor(private options: JwtOptions) {}

  generateTokens(payload: JwtPayload) {
    return signTokens(payload, this.options);
  }

  refresh(refreshToken: string) {
    try {
      const payload = verifyJwt(refreshToken, this.options);
      // Remove iat and exp from payload to generate fresh ones
      const { iat, exp, ...cleanPayload } = payload;
      return signJwt(cleanPayload, this.options);
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  setSession(reply: FastifyReply, tokens: { accessToken: string; refreshToken?: string }) {
    if (!this.options.cookieName) return;

    reply.setCookie(this.options.cookieName, tokens.accessToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.options.expiresInSeconds,
    });

    if (tokens.refreshToken && this.options.refreshTokenExpiresInSeconds) {
      reply.setCookie(`${this.options.cookieName}_refresh`, tokens.refreshToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: this.options.refreshTokenExpiresInSeconds,
      });
    }
  }

  clearSession(reply: FastifyReply) {
    if (!this.options.cookieName) return;

    reply.clearCookie(this.options.cookieName, { path: '/' });
    reply.clearCookie(`${this.options.cookieName}_refresh`, { path: '/' });
  }
}
