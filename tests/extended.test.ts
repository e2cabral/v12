import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createTestingApp } from '../src/core/testing/testing-app.js';
import { defineModule } from '../src/core/http/module.js';
import { createRouter } from '../src/core/http/router.js';
import { definePlugin } from '../src/core/http/plugin.js';
import { apiKey, jwt, role } from '../src/core/security/guards.js';
import { pluginOpenApi } from '../src/core/swagger/openapi.js';
import { signJwt } from '../src/core/auth/jwt.js';

describe('v12 extended capabilities', () => {
  it('supports app.use plugin registration', async () => {
    const app = await createTestingApp();

    await app.use(
      definePlugin('example', (instance) => {
        instance.get('/plugin-check', async () => ({
          plugin: 'ok',
        }));
      }),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/plugin-check',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      plugin: 'ok',
    });
  });

  it('publishes openapi json and docs', async () => {
    const router = createRouter();
    router.get('/', {
      handler: async () => ({ ok: true }),
    });
    router.post('/', {
      schema: {
        body: z.object({
          name: z.string(),
        }),
      },
      handler: async () => ({ ok: true }),
    });

    const CatalogModule = defineModule({
      name: 'catalog',
      routes: router.build(),
    });

    const app = await createTestingApp({
      modules: [CatalogModule],
      plugins: [
        pluginOpenApi([CatalogModule], {
          title: 'V12 Test API',
          version: '1.0.0',
        }),
      ],
    });

    const jsonResponse = await app.inject({
      method: 'GET',
      url: '/openapi.json',
    });

    expect(jsonResponse.statusCode).toBe(200);
    expect(jsonResponse.json()).toMatchObject({
      openapi: '3.1.0',
      info: {
        title: 'V12 Test API',
        version: '1.0.0',
      },
      paths: {
        '/catalog/': {
          get: expect.any(Object),
          post: expect.any(Object),
        },
      },
    });

    const docsResponse = await app.inject({
      method: 'GET',
      url: '/docs',
    });

    expect(docsResponse.statusCode).toBe(200);
    expect(docsResponse.headers['content-type']).toContain('text/html');
  });

  it('protects routes with jwt, role and api key guards', async () => {
    const secret = 'super-secret';
    const router = createRouter();

    router.get('/private', {
      middlewares: [
        jwt({ secret }),
        role('admin'),
        apiKey({ key: 'internal-key' }),
      ],
      handler: ({ request }) => ({
        subject: (request as { auth?: { sub?: string } }).auth?.sub,
      }),
    });

    const SecureModule = defineModule({
      name: 'secure',
      routes: router.build(),
    });

    const app = await createTestingApp({
      modules: [SecureModule],
    });

    const token = signJwt(
      {
        sub: 'user-1',
        role: 'admin',
      },
      { secret, expiresInSeconds: 3600 },
    );

    const denied = await app.inject({
      method: 'GET',
      url: '/secure/private',
    });

    expect(denied.statusCode).toBe(401);

    const allowed = await app.inject({
      method: 'GET',
      url: '/secure/private',
      headers: {
        authorization: `Bearer ${token}`,
        'x-api-key': 'internal-key',
      },
    });

    expect(allowed.statusCode).toBe(200);
    expect(allowed.json()).toMatchObject({
      success: true,
      data: {
        subject: 'user-1',
      },
    });
  });
});
