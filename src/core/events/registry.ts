import type { EventBus } from './event-bus.js';
import type { Container } from '../container/container.js';
import type { EventModuleDefinition } from '../http/module.js';
import { withRetry } from '../resilience/retry.js';

export class EventRegistry {
  constructor(
    private eventBus: EventBus,
    private container: Container,
  ) {}

  register(eventDefinitions: EventModuleDefinition[]) {
    for (const def of eventDefinitions) {
      const { event, handler, resilience } = def;

      this.eventBus.on(event, async (payload: any) => {
        const execute = async () => {
          let effectiveHandler: any;

          if (typeof handler === 'string' || typeof handler === 'symbol') {
            const instance = this.container.resolve(handler as any);
            effectiveHandler = this.getHandlerFromInstance(instance, event);
          } else if (typeof handler === 'function') {
            try {
              // Try to resolve as a DI token first
              const instance = this.container.resolve(handler as any);
              effectiveHandler = this.getHandlerFromInstance(instance, event);
            } catch (e) {
              // Fallback to treat it as a pure function handler
              effectiveHandler = handler;
            }
          } else {
            throw new Error(`Invalid handler type for event "${event}"`);
          }

          return effectiveHandler(payload);
        };

        try {
          if (resilience?.retry) {
            await withRetry(execute, resilience.retry);
          } else {
            await execute();
          }
        } catch (error) {
          console.error(`[EventRegistry] Error executing handler for event "${event}":`, error);
        }
      });
    }
  }

  private getHandlerFromInstance(instance: any, event: string): Function {
    if (typeof instance === 'function') {
      return instance;
    } else if (instance && typeof instance.handle === 'function') {
      return instance.handle.bind(instance);
    }
    throw new Error(`Event handler for "${event}" must be a function or an object with a "handle" method.`);
  }
}
