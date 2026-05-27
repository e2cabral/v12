export type FallbackOptions<T> = {
  fallbackValue?: T | ((error: any) => T | Promise<T>);
  onFallback?: (error: any) => void;
  shouldFallback?: (error: any) => boolean;
};

/**
 * Executes a function and returns a fallback value if it fails.
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  options: FallbackOptions<T> = {},
): Promise<T> {
  const {
    fallbackValue,
    onFallback,
    shouldFallback = () => true,
  } = options;

  try {
    return await fn();
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error;
    }

    if (onFallback) {
      onFallback(error);
    }

    if (typeof fallbackValue === 'function') {
      return await (fallbackValue as Function)(error);
    }

    return fallbackValue as T;
  }
}
