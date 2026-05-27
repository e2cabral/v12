export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

export class EventBus {
  private listeners = new Map<string, EventHandler[]>();

  on<T>(event: string, handler: EventHandler<T>) {
    const current = this.listeners.get(event) ?? [];
    current.push(handler as EventHandler);
    this.listeners.set(event, current);
  }

  emit<T>(event: string, payload: T) {
    const current = this.listeners.get(event) ?? [];
    for (const handler of current) {
      void handler(payload);
    }
  }

  async emitAsync<T>(event: string, payload: T) {
    const current = this.listeners.get(event) ?? [];
    await Promise.all(current.map((handler) => handler(payload)));
  }
}
