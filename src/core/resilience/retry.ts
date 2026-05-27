import { AppError } from '../errors/app-error.js';

export type RetryOptions = {
  attempts?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (error: any, attempt: number) => void;
  shouldRetry?: (error: any) => boolean;
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    attempts = 3,
    delay = 1000,
    backoff = true,
    onRetry,
    shouldRetry = () => true,
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === attempts || !shouldRetry(error)) {
        break;
      }

      if (onRetry) {
        onRetry(error, attempt);
      }

      const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new AppError('Operation failed after retries', {
        details: lastError,
        code: 'RETRY_FAILED',
      });
}
