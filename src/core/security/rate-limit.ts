import rateLimit, { type RateLimitOptions } from '@fastify/rate-limit';
import type { AppInstance } from '../http/app.js';
import { definePlugin } from '../http/plugin.js';

export const pluginRateLimit = (options: RateLimitOptions = {}) =>
  definePlugin('rate-limit', async (app: AppInstance) => {
    await app.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
      ...options,
    });
  });
