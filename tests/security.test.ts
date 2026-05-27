import { describe, expect, it } from 'vitest';
import { createApp } from '../src/core/http/app.js';

describe('Security Features', () => {
  it('enables CORS when configured', async () => {
    const app = await createApp({
      security: {
        cors: true,
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    // Check for CORS header
    expect(response.headers['access-control-allow-origin']).toBe('*');
  });

  it('enables Helmet when configured', async () => {
    const app = await createApp({
      security: {
        helmet: true,
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    // Check for Helmet headers (e.g., X-Content-Type-Options)
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-dns-prefetch-control']).toBe('off');
  });
});
