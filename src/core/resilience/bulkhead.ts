import { AppError } from '../errors/app-error.js';

export type BulkheadOptions = {
  maxParallel?: number;
  maxQueue?: number;
};

/**
 * Semaphore implementation to control concurrency.
 */
class Semaphore {
  private current = 0;
  private queue: (() => void)[] = [];

  constructor(private max: number, private maxQueue: number = 0) {}

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }

    if (this.queue.length >= this.maxQueue) {
      throw new AppError('Bulkhead limit reached', {
        code: 'BULKHEAD_LIMIT',
        statusCode: 429,
      });
    }

    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.current--;
    }
  }
}

const bulkheadInstances = new Map<string, Semaphore>();

/**
 * Limits the number of concurrent executions of a function.
 */
export async function withBulkhead<T>(
  identifier: string,
  fn: () => Promise<T>,
  options: BulkheadOptions = {},
): Promise<T> {
  const { maxParallel = 10, maxQueue = 0 } = options;

  let semaphore = bulkheadInstances.get(identifier);
  if (!semaphore) {
    semaphore = new Semaphore(maxParallel, maxQueue);
    bulkheadInstances.set(identifier, semaphore);
  }

  await semaphore.acquire();
  try {
    return await fn();
  } finally {
    semaphore.release();
  }
}
