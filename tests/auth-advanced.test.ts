import { describe, expect, it } from 'vitest';
import { createApp, defineModule, createRouter } from '../src/app.js';
import { jwt, signJwt, signTokens, AuthService } from '../src/index.js';

describe('Advanced Auth (Cookies & Refresh Token)', () => {
  const secret = 'super-secret';

  it('sets and reads cookies if enabled', async () => {
    const router = createRouter();
    
    router.get('/set-cookie', {
      handler: async ({ reply }) => {
        (reply as any).setCookie('session', 'hello-world', { path: '/' });
        return { ok: true };
      }
    });

    router.get('/get-cookie', {
      handler: async ({ request }) => {
        return { session: (request as any).cookies.session };
      }
    });

    const app = await createApp({
      security: { cookie: true },
      modules: [
        defineModule({
          name: 'cookie-test',
          prefix: '',
          routes: router.build(),
        })
      ]
    });

    const setRes = await app.inject({
      method: 'GET',
      url: '/set-cookie',
    });

    const cookie = setRes.cookies.find(c => c.name === 'session');
    expect(cookie?.value).toBe('hello-world');

    const getRes = await app.inject({
      method: 'GET',
      url: '/get-cookie',
      cookies: { session: 'hello-world' },
    });

    expect(getRes.json()).toEqual({
      success: true,
      data: { session: 'hello-world' }
    });
  });

  it('authenticates via cookie if cookieName is provided', async () => {
    const router = createRouter();

    router.get('/protected', {
      handler: async () => ({ ok: true }),
      middlewares: [jwt({ secret, cookieName: 'access_token' })]
    });

    const app = await createApp({
      security: { cookie: true },
      modules: [
        defineModule({
          name: 'protected-test',
          prefix: '',
          routes: router.build()
        })
      ]
    });

    const token = signJwt({ sub: 'user-1' }, { secret });

    // Sem cookie nem header -> 401
    const res1 = await app.inject({
      method: 'GET',
      url: '/protected',
    });
    expect(res1.statusCode).toBe(401);

    // Com cookie -> 200
    const res2 = await app.inject({
      method: 'GET',
      url: '/protected',
      cookies: { access_token: token },
    });
    expect(res2.statusCode).toBe(200);
  });

  it('generates access and refresh tokens', async () => {
    const tokens = signTokens(
      { sub: 'user-1' },
      { 
        secret, 
        expiresInSeconds: 10, 
        refreshTokenExpiresInSeconds: 60 
      }
    );

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.accessToken).not.toBe(tokens.refreshToken);
  });

  it('uses AuthService for session management', async () => {
    const authService = new AuthService({ 
      secret, 
      expiresInSeconds: 10, 
      refreshTokenExpiresInSeconds: 60,
      cookieName: 'sid'
    });

    const router = createRouter();
    router.post('/login', {
      handler: async ({ reply }) => {
        const tokens = authService.generateTokens({ sub: 'user-1' });
        authService.setSession(reply as any, tokens);
        return { ok: true };
      }
    });

    const app = await createApp({
      security: { cookie: true },
      modules: [
        defineModule({
          name: 'auth-svc-test',
          prefix: '',
          routes: router.build()
        })
      ]
    });

    const res = await app.inject({
      method: 'POST',
      url: '/login',
    });

    const sid = res.cookies.find(c => c.name === 'sid');
    const sidRefresh = res.cookies.find(c => c.name === 'sid_refresh');

    expect(sid).toBeDefined();
    expect(sidRefresh).toBeDefined();
  });
});
