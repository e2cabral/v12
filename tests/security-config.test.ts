import { describe, expect, it } from 'vitest';
import { createApp } from '../src/core/http/app.js';
import { defineModule } from '../src/core/http/module.js';
import { createRouter } from '../src/core/http/router.js';

describe('Security Config', () => {
  it('respects bodyLimit configuration', async () => {
    const router = createRouter();
    router.post('/test', {
      handler: async ({ request }) => request.body,
    });

    const TestModule = defineModule({
      name: 'test',
      routes: router,
    });

    const app = await createApp({
      modules: [TestModule],
      security: {
        bodyLimit: 10, // Very small limit: 10 bytes
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/test/test',
      payload: { name: 'this is a long string' },
    });

    expect(response.statusCode).toBe(413); // Payload Too Large
  });
});
