import { describe, expect, it, vi } from 'vitest';
import { MemoryCacheAdapter } from '../src/core/cache/adapters/memory-cache.js';
import { RedisCacheAdapter } from '../src/core/cache/adapters/redis-cache.js';
import { CacheService } from '../src/core/cache/cache-service.js';

describe('Cache Service', () => {
  it('should work with MemoryCacheAdapter', async () => {
    const adapter = new MemoryCacheAdapter();
    const cache = new CacheService(adapter);

    await cache.set('foo', 'bar');
    expect(await cache.get('foo')).toBe('bar');

    await cache.set('obj', { a: 1 }, 10);
    expect(await cache.get<{a: number}>('obj')).toEqual({ a: 1 });

    await cache.delete('foo');
    expect(await cache.get('foo')).toBeNull();
  });

  it('should handle TTL in MemoryCacheAdapter', async () => {
    const adapter = new MemoryCacheAdapter();
    const cache = new CacheService(adapter);

    vi.useFakeTimers();
    await cache.set('short', 'lived', 1); // 1 second
    
    expect(await cache.get('short')).toBe('lived');
    
    vi.advanceTimersByTime(1100);
    expect(await cache.get('short')).toBeNull();
    vi.useRealTimers();
  });

  it('should work with remember method', async () => {
    const adapter = new MemoryCacheAdapter();
    const cache = new CacheService(adapter);
    let calls = 0;
    const factory = async () => {
      calls++;
      return 'data';
    };

    const res1 = await cache.remember('key', 10, factory);
    const res2 = await cache.remember('key', 10, factory);

    expect(res1).toBe('data');
    expect(res2).toBe('data');
    expect(calls).toBe(1);
  });

  it('should work with RedisCacheAdapter (mocked)', async () => {
    const redisMock = {
      get: vi.fn().mockResolvedValue(JSON.stringify({ x: 1 })),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
    };

    const adapter = new RedisCacheAdapter(redisMock);
    const cache = new CacheService(adapter);

    const val = await cache.get('key');
    expect(val).toEqual({ x: 1 });
    expect(redisMock.get).toHaveBeenCalledWith('key');

    await cache.set('new', 'val', 60);
    expect(redisMock.set).toHaveBeenCalledWith('new', 'val', 'EX', 60);
  });
});

import { QueueService } from '../src/core/queue/queue-service.js';
import { WorkerService } from '../src/core/queue/worker-service.js';

// Mock BullMQ because it needs a real Redis connection
vi.mock('bullmq', () => {
  return {
    Queue: vi.fn().mockImplementation((name) => ({
      name,
      add: vi.fn().mockResolvedValue({ id: '1' }),
      close: vi.fn().mockResolvedValue(undefined),
    })),
    Worker: vi.fn().mockImplementation((name, handler) => ({
      name,
      handler,
      close: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

describe('Queue & Worker Service', () => {
  it('should register and add jobs', async () => {
    const redisConfig = { host: 'localhost' };
    const queueService = new QueueService(redisConfig);
    const workerService = new WorkerService(redisConfig);

    const job = await queueService.add('emails', 'send', { to: 'test@example.com' });
    expect(job.id).toBe('1');

    const handler = async () => ({ success: true });
    const worker = workerService.register('emails', handler);
    expect(worker.name).toBe('emails');

    await queueService.close();
    await workerService.close();
  });
});
