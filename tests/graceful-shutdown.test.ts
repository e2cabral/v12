import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/core/http/app.js';
import { setupGracefulShutdown } from '../src/core/http/shutdown.js';

describe('graceful shutdown', () => {
  beforeEach(() => {
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    vi.spyOn(process, 'on');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('app.shutdown() calls app.close() and resolves', async () => {
    const app = await createApp({
      shutdown: { signals: [] }, // no signals, to avoid polluting process
    });

    const closeSpy = vi.spyOn(app, 'close').mockResolvedValue(undefined as any);

    await app.shutdown();

    expect(closeSpy).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('double shutdown is prevented', async () => {
    const app = await createApp({
      shutdown: { signals: [] },
    });

    const closeSpy = vi.spyOn(app, 'close').mockResolvedValue(undefined as any);

    await app.shutdown();
    await app.shutdown();

    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(process.exit).toHaveBeenCalledTimes(1);
  });

  it('shutdown timeout triggers force exit', async () => {
    vi.useFakeTimers();

    const app = await createApp({
      shutdown: { signals: [], timeout: 500 },
    });

    // Make app.close() never resolve
    vi.spyOn(app, 'close').mockReturnValue(new Promise(() => {}) as any);

    // Start shutdown (don't await - it will never resolve)
    app.shutdown();

    // Advance timers past the timeout
    vi.advanceTimersByTime(600);

    expect(process.exit).toHaveBeenCalledWith(1);

    vi.useRealTimers();
  });

  it('default options are applied correctly', async () => {
    const app = await createApp({
      shutdown: true,
    });

    // Verify signal handlers were registered
    const onCalls = vi.mocked(process.on).mock.calls;
    const sigTermCalls = onCalls.filter(([signal]) => signal === 'SIGTERM');
    const sigIntCalls = onCalls.filter(([signal]) => signal === 'SIGINT');

    expect(sigTermCalls.length).toBeGreaterThanOrEqual(1);
    expect(sigIntCalls.length).toBeGreaterThanOrEqual(1);
    expect(app.shutdown).toBeTypeOf('function');
  });

  it('custom signals option works', async () => {
    const app = await createApp({
      shutdown: { signals: ['SIGUSR1'] },
    });

    const onCalls = vi.mocked(process.on).mock.calls;
    const sigusr1Calls = onCalls.filter(([signal]) => signal === 'SIGUSR1');
    const sigTermCalls = onCalls.filter(([signal]) => signal === 'SIGTERM');

    expect(sigusr1Calls.length).toBeGreaterThanOrEqual(1);
    // SIGTERM should NOT be installed since we overrode signals
    expect(sigTermCalls.length).toBe(0);
  });

  it('shutdown is disabled when enabled: false', async () => {
    const app = await createApp({
      shutdown: { enabled: false },
    });

    // No signal handlers should be registered for SIGTERM/SIGINT
    const onCalls = vi.mocked(process.on).mock.calls;
    const sigTermCalls = onCalls.filter(([signal]) => signal === 'SIGTERM');
    const sigIntCalls = onCalls.filter(([signal]) => signal === 'SIGINT');

    expect(sigTermCalls.length).toBe(0);
    expect(sigIntCalls.length).toBe(0);
  });

  it('shutdown is disabled by default in createTestingApp', async () => {
    const { createTestingApp } = await import('../src/core/testing/testing-app.js');

    const app = await createTestingApp();

    // No signal handlers should have been registered
    const onCalls = vi.mocked(process.on).mock.calls;
    const sigTermCalls = onCalls.filter(([signal]) => signal === 'SIGTERM');
    const sigIntCalls = onCalls.filter(([signal]) => signal === 'SIGINT');

    expect(sigTermCalls.length).toBe(0);
    expect(sigIntCalls.length).toBe(0);
  });

  it('handles close error gracefully', async () => {
    const app = await createApp({
      shutdown: { signals: [] },
    });

    vi.spyOn(app, 'close').mockRejectedValue(new Error('close failed'));

    await app.shutdown();

    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
