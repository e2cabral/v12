import { describe, expect, it } from 'vitest';
import { createApp } from '../src/core/http/app.js';
import { pluginRateLimit } from '../src/core/security/rate-limit.js';
import { defineModule } from '../src/core/http/module.js';
import { createRouter } from '../src/core/http/router.js';

describe('Rate Limit Plugin', () => {
  it('adds rate limit headers to responses', async () => {
    const router = createRouter();
    router.get('/test', {
      handler: async () => ({ ok: true }),
    });

    const TestModule = defineModule({
      name: 'test',
      routes: router,
    });

    const app = await createApp({
      modules: [TestModule],
      plugins: [
        pluginRateLimit({
          max: 2,
          timeWindow: '1 minute',
        }),
      ],
    });

    // First request
    const res1 = await app.inject({
      method: 'GET',
      url: '/test/test',
    });
    expect(res1.headers['x-ratelimit-limit']).toBe('2');
    expect(res1.headers['x-ratelimit-remaining']).toBe('1');

    // Second request
    const res2 = await app.inject({
      method: 'GET',
      url: '/test/test',
    });
    expect(res2.headers['x-ratelimit-remaining']).toBe('0');

    // Third request (should fail)
    const res3 = await app.inject({
      method: 'GET',
      url: '/test/test',
    });
    expect(res3.statusCode).toBe(429);
  });
});
