import { describe, it, expect, vi, expectTypeOf } from 'vitest';
import { EventBus, defineEvent, type TypedEvent, type EventHandler } from '../src/core/events/event-bus';

describe('Typed EventBus', () => {
  describe('defineEvent', () => {
    it('should create a typed event token with the given name', () => {
      const UserCreated = defineEvent<{ id: string }>('user.created');

      expect(UserCreated.name).toBe('user.created');
      expect(UserCreated).toHaveProperty('name');
      expect(UserCreated).toHaveProperty('__type');
    });

    it('should create distinct tokens for different event names', () => {
      const EventA = defineEvent<{ a: number }>('event.a');
      const EventB = defineEvent<{ b: string }>('event.b');

      expect(EventA.name).not.toBe(EventB.name);
    });
  });

  describe('on() with typed events', () => {
    it('should register a handler for a typed event', () => {
      const bus = new EventBus();
      const UserCreated = defineEvent<{ id: string; email: string }>('user.created');
      const handler = vi.fn();

      bus.on(UserCreated, handler);
      bus.emit(UserCreated, { id: '1', email: 'test@test.com' });

      expect(handler).toHaveBeenCalledWith({ id: '1', email: 'test@test.com' });
    });

    it('should support multiple handlers for the same typed event', () => {
      const bus = new EventBus();
      const OrderPlaced = defineEvent<{ orderId: string; total: number }>('order.placed');
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.on(OrderPlaced, handler1);
      bus.on(OrderPlaced, handler2);
      bus.emit(OrderPlaced, { orderId: 'abc', total: 99.99 });

      expect(handler1).toHaveBeenCalledWith({ orderId: 'abc', total: 99.99 });
      expect(handler2).toHaveBeenCalledWith({ orderId: 'abc', total: 99.99 });
    });
  });

  describe('emit() with typed events', () => {
    it('should emit a typed event and call registered handlers', () => {
      const bus = new EventBus();
      const ItemAdded = defineEvent<{ itemId: string; quantity: number }>('cart.item.added');
      const handler = vi.fn();

      bus.on(ItemAdded, handler);
      bus.emit(ItemAdded, { itemId: 'item-1', quantity: 3 });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ itemId: 'item-1', quantity: 3 });
    });

    it('should not call handlers for different typed events', () => {
      const bus = new EventBus();
      const EventA = defineEvent<{ a: number }>('event.a');
      const EventB = defineEvent<{ b: number }>('event.b');
      const handlerA = vi.fn();
      const handlerB = vi.fn();

      bus.on(EventA, handlerA);
      bus.on(EventB, handlerB);
      bus.emit(EventA, { a: 1 });

      expect(handlerA).toHaveBeenCalledWith({ a: 1 });
      expect(handlerB).not.toHaveBeenCalled();
    });
  });

  describe('emitAsync() with typed events', () => {
    it('should emit async and wait for all handlers to complete', async () => {
      const bus = new EventBus();
      const DataSynced = defineEvent<{ source: string; count: number }>('data.synced');
      const results: string[] = [];

      bus.on(DataSynced, async (payload) => {
        await new Promise((r) => setTimeout(r, 10));
        results.push(`handler1:${payload.source}:${payload.count}`);
      });

      bus.on(DataSynced, async (payload) => {
        results.push(`handler2:${payload.source}:${payload.count}`);
      });

      await bus.emitAsync(DataSynced, { source: 'api', count: 42 });

      expect(results).toContain('handler1:api:42');
      expect(results).toContain('handler2:api:42');
      expect(results).toHaveLength(2);
    });
  });

  describe('backwards compatibility - string events', () => {
    it('should still work with plain string events on()', () => {
      const bus = new EventBus();
      const handler = vi.fn();

      bus.on('legacy.event', handler);
      bus.emit('legacy.event', { data: 'hello' });

      expect(handler).toHaveBeenCalledWith({ data: 'hello' });
    });

    it('should still work with plain string events emitAsync()', async () => {
      const bus = new EventBus();
      const handler = vi.fn();

      bus.on('async.legacy', handler);
      await bus.emitAsync('async.legacy', { value: 123 });

      expect(handler).toHaveBeenCalledWith({ value: 123 });
    });

    it('should allow mixing string and typed events that share the same name', () => {
      const bus = new EventBus();
      const TypedFoo = defineEvent<{ x: number }>('foo');
      const typedHandler = vi.fn();
      const stringHandler = vi.fn();

      bus.on(TypedFoo, typedHandler);
      bus.on('foo', stringHandler);

      bus.emit(TypedFoo, { x: 1 });

      // Both handlers are registered under the same key 'foo'
      expect(typedHandler).toHaveBeenCalledWith({ x: 1 });
      expect(stringHandler).toHaveBeenCalledWith({ x: 1 });
    });
  });

  describe('type safety (compile-time checks)', () => {
    it('should infer correct payload type from TypedEvent', () => {
      const UserCreated = defineEvent<{ id: string; email: string }>('user.created');

      expectTypeOf(UserCreated).toMatchTypeOf<TypedEvent<{ id: string; email: string }>>();
      expectTypeOf(UserCreated.name).toBeString();
    });

    it('should infer handler payload type from TypedEvent in on()', () => {
      const bus = new EventBus();
      const UserCreated = defineEvent<{ id: string; email: string }>('user.created');

      bus.on(UserCreated, (payload) => {
        expectTypeOf(payload).toEqualTypeOf<{ id: string; email: string }>();
      });
    });

    it('should enforce correct payload type in emit()', () => {
      const bus = new EventBus();
      const NumberEvent = defineEvent<{ value: number }>('number.event');

      // This should compile fine
      bus.emit(NumberEvent, { value: 42 });

      // Type checks: the payload type should match
      expectTypeOf(bus.emit<{ value: number }>).toBeCallableWith(NumberEvent, { value: 42 });
    });

    it('should enforce correct payload type in emitAsync()', () => {
      const bus = new EventBus();
      const StringEvent = defineEvent<{ message: string }>('string.event');

      // This should compile fine
      bus.emitAsync(StringEvent, { message: 'hello' });

      expectTypeOf(bus.emitAsync<{ message: string }>).toBeCallableWith(StringEvent, { message: 'hello' });
    });

    it('should keep EventHandler type generic', () => {
      type TestHandler = EventHandler<{ count: number }>;
      expectTypeOf<TestHandler>().toEqualTypeOf<(payload: { count: number }) => void | Promise<void>>();
    });
  });
});
