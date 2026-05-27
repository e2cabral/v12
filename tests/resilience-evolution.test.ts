import { describe, it, expect, vi } from 'vitest';
import { createApp } from '../src/core/http/app.js';
import { createRouter } from '../src/core/http/router.js';
import { defineModule } from '../src/core/http/module.js';
import { definePlugin } from '../src/core/http/plugin.js';
import { AppError } from '../src/core/errors/app-error.js';

describe('Resilience and Plugin Evolution', () => {
  it('should apply timeout protection to a route', async () => {
    const router = createRouter();
    router.get('/slow', {
      resilience: {
        timeout: { milliseconds: 100 }
      },
      handler: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { done: true };
      }
    });

    const app = await createApp({
      modules: [defineModule({ name: 'test', routes: router })]
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test/slow'
    });

    expect(response.statusCode).toBe(408);
    expect(response.json().success).toBe(false);
    expect(response.json().error.code).toBe('TIMEOUT');
  });

  it('should apply fallback protection to a route', async () => {
    const router = createRouter();
    router.get('/fail', {
      resilience: {
        fallback: { fallbackValue: { msg: 'fallback' } }
      },
      handler: async () => {
        throw new Error('Boom');
      }
    });

    const app = await createApp({
      modules: [defineModule({ name: 'test', routes: router })]
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test/fail'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toEqual({ msg: 'fallback' });
  });

  it('should respect bulkhead concurrency limits', async () => {
    const router = createRouter();
    let concurrent = 0;
    let maxConcurrent = 0;

    router.get('/limited', {
      resilience: {
        bulkhead: { maxParallel: 2, maxQueue: 0 }
      },
      handler: async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise(resolve => setTimeout(resolve, 100));
        concurrent--;
        return { ok: true };
      }
    });

    const app = await createApp({
      modules: [defineModule({ name: 'test', routes: router })]
    });

    // Send 3 requests
    const p1 = app.inject({ method: 'GET', url: '/test/limited' });
    const p2 = app.inject({ method: 'GET', url: '/test/limited' });
    const p3 = app.inject({ method: 'GET', url: '/test/limited' });

    const results = await Promise.all([p1, p2, p3]);

    expect(maxConcurrent).toBeLessThanOrEqual(2);
    expect(results.some(r => r.statusCode === 429)).toBe(true);
  });

  it('should trigger plugin lifecycle hooks', async () => {
    const hooks = {
      init: vi.fn(),
      ready: vi.fn(),
      close: vi.fn()
    };

    const myPlugin = definePlugin({
      name: 'lifecycle-test',
      onInit: async () => hooks.init(),
      onReady: async () => hooks.ready(),
      onClose: async () => hooks.close(),
      register: () => {}
    });

    const app = await createApp({
      plugins: [myPlugin]
    });

    expect(hooks.init).toHaveBeenCalled();
    
    await app.ready();
    expect(hooks.ready).toHaveBeenCalled();

    await app.close();
    expect(hooks.close).toHaveBeenCalled();
  });
});
