import type { AppInstance } from './app.js';

export type ShutdownOptions = {
  timeout?: number;
  signals?: string[];
  enabled?: boolean;
};

const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_SIGNALS = ['SIGTERM', 'SIGINT'];

export function setupGracefulShutdown(
  app: AppInstance,
  options: ShutdownOptions = {},
): void {
  const {
    timeout = DEFAULT_TIMEOUT,
    signals = DEFAULT_SIGNALS,
    enabled = true,
  } = options;

  if (!enabled) {
    // Decorate with a no-op so the type is satisfied
    app.decorate('shutdown', async () => {});
    return;
  }

  let isShuttingDown = false;

  const shutdown = async (): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    app.log.info('Graceful shutdown initiated...');

    const timer = setTimeout(() => {
      app.log.error('Shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, timeout);

    // Ensure the timer doesn't keep the event loop alive
    if (timer.unref) {
      timer.unref();
    }

    try {
      await app.close();
      app.log.info('Server closed successfully');
      process.exit(0);
    } catch (error) {
      app.log.error({ err: error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  // Decorate the app with the shutdown method
  app.decorate('shutdown', shutdown);

  // Install signal handlers
  for (const signal of signals) {
    process.on(signal, shutdown);
  }
}

