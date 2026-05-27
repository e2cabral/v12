import { describe, expect, it } from 'vitest';
import { createTestingApp } from '../src/core/testing/testing-app.js';
import { UsersModule } from './features/users/users.module.js';

describe('v12 app', () => {
  it('returns health status', async () => {
    const app = await createTestingApp({ modules: [UsersModule] });

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      success: true,
      data: {
        status: 'ok',
        memory: expect.any(Object),
        node: expect.stringContaining('v'),
      },
    });
  });

  it('returns welcome message on root path', async () => {
    const app = await createTestingApp({ modules: [UsersModule] });
    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: expect.objectContaining({
        message: 'Welcome to V12 Framework',
      }),
    });
  });

  it('returns html on root path if accepted', async () => {
    const app = await createTestingApp({ modules: [UsersModule] });
    const response = await app.inject({
      method: 'GET',
      url: '/',
      headers: {
        accept: 'text/html',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.body).toContain('Welcome to V12');
  });
});
