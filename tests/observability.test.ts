import { describe, expect, it } from 'vitest';
import { createApp } from '../src/core/http/app.js';
import { defineModule } from '../src/core/http/module.js';
import { createRouter } from '../src/core/http/router.js';

describe('Observability', () => {
  it('returns x-request-id header and updates metrics', async () => {
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
    });

    // Make a request
    const response = await app.inject({
      method: 'GET',
      url: '/test/test',
    });

    expect(response.headers['x-request-id']).toBeDefined();

    // Check metrics
    const metricsResponse = await app.inject({
      method: 'GET',
      url: '/metrics',
    });

    expect(metricsResponse.statusCode).toBe(200);
    const text = metricsResponse.body;
    expect(text).toContain('v12_requests_total 2'); // 1 for /test/test, 1 for /metrics
  });
});
