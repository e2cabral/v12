import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus, defineEvent } from '../src/core/events/event-bus';

describe('EventBus Error Handling', () => {
  describe('emit() with throwing handler', () => {
    it('should NOT throw when a sync handler throws (fire-and-forget)', () => {
      const bus = new EventBus();
      bus.on('test.event', () => {
        throw new Error('handler failed');
      });

      expect(() => bus.emit('test.event', { data: 1 })).not.toThrow();
    });

    it('should call onError when a sync handler throws', () => {
      const onError = vi.fn();
      const bus = new EventBus({ onError });
      const error = new Error('sync failure');

      bus.on('my.event', () => {
        throw error;
      });

      bus.emit('my.event', { value: 42 });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith('my.event', error);
    });

    it('should call onError when an async handler rejects', async () => {
      const onError = vi.fn();
      const bus = new EventBus({ onError });
      const error = new Error('async failure');

      bus.on('async.event', async () => {
        throw error;
      });

      bus.emit('async.event', { value: 'test' });

      // Wait for the microtask to complete
      await new Promise((r) => setTimeout(r, 10));

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith('async.event', error);
    });
  });

  describe('onError callback', () => {
    it('should receive the event name and error', () => {
      const onError = vi.fn();
      const bus = new EventBus({ onError });
      const error = new Error('specific error');

      bus.on('order.failed', () => {
        throw error;
      });

      bus.emit('order.failed', {});

      expect(onError).toHaveBeenCalledWith('order.failed', error);
    });

    it('should be called for each failing handler independently', () => {
      const onError = vi.fn();
      const bus = new EventBus({ onError });
      const error1 = new Error('error 1');
      const error2 = new Error('error 2');

      bus.on('multi.fail', () => {
        throw error1;
      });
      bus.on('multi.fail', () => {
        throw error2;
      });

      bus.emit('multi.fail', {});

      expect(onError).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenCalledWith('multi.fail', error1);
      expect(onError).toHaveBeenCalledWith('multi.fail', error2);
    });
  });

  describe('__error__ internal event', () => {
    it('should emit __error__ event when a handler fails', () => {
      const bus = new EventBus();
      const errorHandler = vi.fn();
      const originalError = new Error('something broke');

      bus.on('__error__', errorHandler);
      bus.on('user.created', () => {
        throw originalError;
      });

      bus.emit('user.created', { id: '1' });

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledWith({
        event: 'user.created',
        error: originalError,
      });
    });

    it('should NOT recurse when __error__ handler itself throws', () => {
      const onError = vi.fn();
      const bus = new EventBus({ onError });

      bus.on('__error__', () => {
        throw new Error('error handler also fails');
      });
      bus.on('test.event', () => {
        throw new Error('original error');
      });

      // Should not throw or infinite loop
      expect(() => bus.emit('test.event', {})).not.toThrow();
    });

    it('should NOT emit __error__ when the __error__ event itself is the source', () => {
      const bus = new EventBus();
      const errorHandler = vi.fn();

      bus.on('__error__', errorHandler);

      // Manually emit __error__ — this should NOT trigger the error handler again
      bus.on('__error__', () => {
        throw new Error('should not recurse');
      });

      // Emitting a regular event that triggers __error__
      bus.on('some.event', () => {
        throw new Error('fail');
      });

      expect(() => bus.emit('some.event', {})).not.toThrow();
    });
  });

  describe('emitAsync() without continueOnError', () => {
    it('should throw on first failure (existing behavior)', async () => {
      const bus = new EventBus();
      const handler1 = vi.fn().mockRejectedValue(new Error('fail'));
      const handler2 = vi.fn();

      bus.on('async.test', handler1);
      bus.on('async.test', handler2);

      await expect(bus.emitAsync('async.test', {})).rejects.toThrow('fail');
    });
  });

  describe('emitAsync() with continueOnError', () => {
    it('should execute ALL handlers even if some fail', async () => {
      const bus = new EventBus();
      const results: string[] = [];

      bus.on('resilient.event', async () => {
        results.push('handler1');
        throw new Error('handler1 fails');
      });
      bus.on('resilient.event', async () => {
        results.push('handler2');
      });
      bus.on('resilient.event', async () => {
        results.push('handler3');
        throw new Error('handler3 fails');
      });

      try {
        await bus.emitAsync('resilient.event', {}, { continueOnError: true });
      } catch {
        // expected
      }

      expect(results).toEqual(['handler1', 'handler2', 'handler3']);
    });

    it('should throw AggregateError with all errors', async () => {
      const bus = new EventBus();
      const error1 = new Error('error 1');
      const error2 = new Error('error 2');

      bus.on('multi.error', async () => {
        throw error1;
      });
      bus.on('multi.error', async () => {
        // success
      });
      bus.on('multi.error', async () => {
        throw error2;
      });

      try {
        await bus.emitAsync('multi.error', {}, { continueOnError: true });
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AggregateError);
        const aggErr = err as AggregateError;
        expect(aggErr.errors).toHaveLength(2);
        expect(aggErr.errors).toContain(error1);
        expect(aggErr.errors).toContain(error2);
        expect(aggErr.message).toBe('2 handler(s) failed for event "multi.error"');
      }
    });

    it('should call onError for each failing handler', async () => {
      const onError = vi.fn();
      const bus = new EventBus({ onError });

      bus.on('tracked.event', async () => {
        throw new Error('fail A');
      });
      bus.on('tracked.event', async () => {
        throw new Error('fail B');
      });

      try {
        await bus.emitAsync('tracked.event', {}, { continueOnError: true });
      } catch {
        // expected
      }

      expect(onError).toHaveBeenCalledTimes(2);
    });

    it('should not throw when no handler fails', async () => {
      const bus = new EventBus();

      bus.on('happy.path', async () => {
        /* success */
      });
      bus.on('happy.path', async () => {
        /* success */
      });

      await expect(
        bus.emitAsync('happy.path', { data: true }, { continueOnError: true }),
      ).resolves.toBeUndefined();
    });
  });

  describe('regression - handlers that do not throw still work fine', () => {
    it('should call all handlers normally when no errors occur', () => {
      const bus = new EventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.on('normal.event', handler1);
      bus.on('normal.event', handler2);

      bus.emit('normal.event', { x: 1 });

      expect(handler1).toHaveBeenCalledWith({ x: 1 });
      expect(handler2).toHaveBeenCalledWith({ x: 1 });
    });

    it('should still execute non-failing handlers after a failing one in emit()', () => {
      const bus = new EventBus();
      const handler1 = vi.fn(() => {
        throw new Error('fail');
      });
      const handler2 = vi.fn();

      bus.on('mixed.event', handler1);
      bus.on('mixed.event', handler2);

      bus.emit('mixed.event', { y: 2 });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith({ y: 2 });
    });
  });

  describe('backwards compatibility', () => {
    it('should work without any options (no onError)', () => {
      const bus = new EventBus();
      const handler = vi.fn();

      bus.on('simple', handler);
      bus.emit('simple', 'hello');

      expect(handler).toHaveBeenCalledWith('hello');
    });

    it('should not throw when a handler fails and no onError is configured', () => {
      const bus = new EventBus();

      bus.on('fail.silently', () => {
        throw new Error('no one cares');
      });

      expect(() => bus.emit('fail.silently', {})).not.toThrow();
    });

    it('should work with typed events and error handling', () => {
      const onError = vi.fn();
      const bus = new EventBus({ onError });
      const UserCreated = defineEvent<{ id: string }>('user.created');
      const error = new Error('typed event failure');

      bus.on(UserCreated, () => {
        throw error;
      });

      bus.emit(UserCreated, { id: '123' });

      expect(onError).toHaveBeenCalledWith('user.created', error);
    });

    it('emitAsync should work with typed events and continueOnError', async () => {
      const bus = new EventBus();
      const OrderPlaced = defineEvent<{ orderId: string }>('order.placed');
      const results: string[] = [];

      bus.on(OrderPlaced, async (payload) => {
        results.push(`processed:${payload.orderId}`);
        throw new Error('processing failed');
      });
      bus.on(OrderPlaced, async (payload) => {
        results.push(`notified:${payload.orderId}`);
      });

      try {
        await bus.emitAsync(OrderPlaced, { orderId: 'ord-1' }, { continueOnError: true });
      } catch {
        // expected
      }

      expect(results).toEqual(['processed:ord-1', 'notified:ord-1']);
    });
  });
});
