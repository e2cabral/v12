import { AppError } from '../errors/app-error.js';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerStorage {
  getState(): Promise<CircuitState>;
  setState(state: CircuitState, ttl?: number): Promise<void>;
  getFailures(): Promise<number>;
  incrementFailures(ttl?: number): Promise<number>;
  resetFailures(): Promise<void>;
  getLastFailureTime(): Promise<number | null>;
}

class InMemoryStorage implements CircuitBreakerStorage {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureTime: number | null = null;

  async getState() {
    return this.state;
  }

  async setState(state: CircuitState) {
    this.state = state;
    if (state === CircuitState.OPEN) {
      this.lastFailureTime = Date.now();
    }
  }

  async getFailures() {
    return this.failures;
  }

  async incrementFailures() {
    return ++this.failures;
  }

  async resetFailures() {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  async getLastFailureTime() {
    return this.lastFailureTime;
  }
}

class RedisStorage implements CircuitBreakerStorage {
  constructor(
    private redis: any,
    private key: string,
  ) {}

  async getState() {
    return (
      ((await this.redis.get(`${this.key}:state`)) as CircuitState) ||
      CircuitState.CLOSED
    );
  }

  async setState(state: CircuitState, ttl: number = 3600) {
    await this.redis.set(`${this.key}:state`, state, 'EX', ttl);
    if (state === CircuitState.OPEN) {
      await this.redis.set(
        `${this.key}:lastFailureTime`,
        Date.now().toString(),
        'EX',
        ttl,
      );
    }
  }

  async getFailures() {
    const val = await this.redis.get(`${this.key}:failures`);
    return val ? parseInt(val, 10) : 0;
  }

  async incrementFailures(ttl: number = 3600) {
    const val = await this.redis.incr(`${this.key}:failures`);
    await this.redis.expire(`${this.key}:failures`, ttl);
    return val;
  }

  async resetFailures() {
    await this.redis.del(`${this.key}:failures`);
    await this.redis.set(`${this.key}:state`, CircuitState.CLOSED, 'EX', 3600);
  }

  async getLastFailureTime() {
    const val = await this.redis.get(`${this.key}:lastFailureTime`);
    return val ? parseInt(val, 10) : null;
  }
}

export type CircuitBreakerOptions = {
  failureThreshold?: number;
  resetTimeout?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onHalfOpen?: () => void;
  redis?: {
    client: any;
    key: string;
  };
};

export class CircuitBreaker {
  private readonly storage: CircuitBreakerStorage;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30000; // 30 seconds
    this.storage = options.redis
      ? new RedisStorage(options.redis.client, options.redis.key)
      : new InMemoryStorage();
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = await this.storage.getState();
    const lastFailureTime = await this.storage.getLastFailureTime();

    if (state === CircuitState.OPEN) {
      if (Date.now() - (lastFailureTime || 0) > this.resetTimeout) {
        await this.storage.setState(
          CircuitState.HALF_OPEN,
          Math.ceil(this.resetTimeout / 1000) * 2,
        );
      } else {
        throw new AppError('Circuit breaker is open', {
          statusCode: 503,
          code: 'CIRCUIT_OPEN',
        });
      }
    }

    try {
      const result = await fn();
      await this.onSuccess();
      return result;
    } catch (error) {
      await this.onFailure();
      throw error;
    }
  }

  private async onSuccess() {
    await this.storage.resetFailures();
  }

  private async onFailure() {
    const failures = await this.storage.incrementFailures(
      Math.ceil(this.resetTimeout / 1000) * 2,
    );

    if (failures >= this.failureThreshold) {
      await this.storage.setState(
        CircuitState.OPEN,
        Math.ceil(this.resetTimeout / 1000) * 2,
      );
    }
  }

  async getState(): Promise<CircuitState> {
    return await this.storage.getState();
  }
}
