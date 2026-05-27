import { describe, it, expect, vi } from 'vitest';
import { createApp } from '../src/core/http/app';
import { defineModule } from '../src/core/http/module';
import { EventBus } from '../src/core/events/event-bus';

describe('V12 Event Evolution', () => {
  it('should handle events with DI-resolved class handlers', async () => {
    let callCount = 0;

    class TestEventHandler {
      static inject = ['EventBus'];
      constructor(private bus: EventBus) {}

      handle(payload: { value: number }) {
        callCount += payload.value;
        expect(this.bus).toBeDefined();
      }
    }

    const testModule = defineModule({
      name: 'test',
      providers: [TestEventHandler],
      events: [
        {
          event: 'test.event',
          handler: TestEventHandler,
        },
      ],
    });

    const app = await createApp({
      modules: [testModule],
    });

    const bus = app.container.resolve<EventBus>('EventBus');
    await bus.emitAsync('test.event', { value: 10 });

    expect(callCount).toBe(10);
  });

  it('should apply resilience (retry) to event handlers', async () => {
    let callCount = 0;

    const handler = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 3) {
        throw new Error('Temporary failure');
      }
    });

    const testModule = defineModule({
      name: 'test',
      events: [
        {
          event: 'retry.event',
          handler: handler,
          resilience: {
            retry: { attempts: 3, delay: 10 },
          },
        },
      ],
    });

    const app = await createApp({
      modules: [testModule],
    });

    const bus = app.container.resolve<EventBus>('EventBus');
    
    // We need to wait for the event registry to finish its async execution
    // Since emitAsync only waits for the listeners (which are async wrappers in EventRegistry)
    await bus.emitAsync('retry.event', {});
    
    // Give some time for retries to complete if they are internal to the registry wrapper
    await new Promise(r => setTimeout(r, 100));

    expect(callCount).toBe(3);
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it('should support functional handlers with DI via container.resolve (not implemented in registry but possible if passed as token)', async () => {
    let callCount = 0;
    
    const token = Symbol('Handler');
    const provider = {
        provide: token,
        useValue: (payload: any) => {
            callCount += payload.amount;
        }
    };

    const testModule = defineModule({
      name: 'test',
      providers: [provider],
      events: [
        {
          event: 'func.event',
          handler: token,
        },
      ],
    });

    const app = await createApp({
      modules: [testModule],
    });

    const bus = app.container.resolve<EventBus>('EventBus');
    await bus.emitAsync('func.event', { amount: 5 });

    expect(callCount).toBe(5);
  });
});
