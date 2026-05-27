import { AppError } from '../errors/app-error.js';

export type TimeoutOptions = {
  milliseconds?: number;
  message?: string;
};

/**
 * Executes a function with a timeout limit.
 * Uses AbortController to signal the function if the timeout is reached.
 */
export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  options: TimeoutOptions = {},
): Promise<T> {
  const { milliseconds = 5000, message = 'Operation timed out' } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), milliseconds);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new AppError(message, { code: 'TIMEOUT', statusCode: 408 }));
    }, milliseconds);
  });

  try {
    return await Promise.race([fn(controller.signal), timeoutPromise]);
  } catch (error: any) {
    if (
      error.name === 'AbortError' ||
      controller.signal.aborted ||
      error.code === 'TIMEOUT'
    ) {
      throw new AppError(message, {
        code: 'TIMEOUT',
        statusCode: 408,
      });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
