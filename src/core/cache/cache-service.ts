import type { CacheAdapter } from './cache-adapter.js';

export class CacheService {
  constructor(private adapter: CacheAdapter) {}

  async get<T>(key: string): Promise<T | null> {
    return this.adapter.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    return this.adapter.set(key, value, ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    return this.adapter.delete(key);
  }

  async clear(): Promise<void> {
    return this.adapter.clear();
  }

  /**
   * Tenta buscar do cache, se no existir, executa a factory, salva no cache e retorna.
   */
  async remember<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const result = await factory();
    await this.set(key, result, ttlSeconds);
    return result;
  }
}
