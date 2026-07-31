export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

/**
 * A typed event token that carries payload type information at compile time.
 * The `__type` property is a phantom type — it exists only for TypeScript inference.
 */
export type TypedEvent<T> = {
  readonly name: string;
  readonly __type: T;
};

/**
 * Creates a typed event token for use with EventBus.
 *
 * @example
 * ```ts
 * const UserCreated = defineEvent<{ id: string; email: string }>('user.created');
 * bus.on(UserCreated, (payload) => {
 *   // payload is inferred as { id: string; email: string }
 * });
 * ```
 */
export function defineEvent<T>(name: string): TypedEvent<T> {
  return { name, __type: undefined as unknown as T };
}

/**
 * EventKey can be either a plain string or a typed event token.
 */
export type EventKey<T = unknown> = string | TypedEvent<T>;

/**
 * Options for configuring the EventBus instance.
 */
export type EventBusOptions = {
  onError?: (event: string, error: unknown) => void;
};

/**
 * Options for emitAsync behavior.
 */
export type EmitAsyncOptions = {
  continueOnError?: boolean;
};

/**
 * Barramento de eventos com suporte a listeners síncronos e assíncronos, tipagem forte e tratamento de erros.
 *
 * @example
 * ```ts
 * const bus = new EventBus();
 * bus.on('user.created', (payload) => console.log(payload));
 * bus.emit('user.created', { id: '1', email: 'a@b.com' });
 * ```
 */
export class EventBus {
  private listeners = new Map<string, EventHandler[]>();
  private onError?: (event: string, error: unknown) => void;

  constructor(options?: EventBusOptions) {
    this.onError = options?.onError;
  }

  /**
   * Registra um handler para um evento.
   *
   * @param event - Nome do evento (string) ou token tipado (TypedEvent).
   * @param handler - Função a ser chamada quando o evento for emitido.
   *
   * @example
   * ```ts
   * bus.on(UserCreated, (payload) => sendEmail(payload.email));
   * ```
   */
  on<T>(event: TypedEvent<T>, handler: EventHandler<T>): void;
  on<T>(event: string, handler: EventHandler<T>): void;
  on<T>(event: EventKey<T>, handler: EventHandler<T>): void {
    const key = typeof event === 'string' ? event : event.name;
    const current = this.listeners.get(key) ?? [];
    current.push(handler as EventHandler);
    this.listeners.set(key, current);
  }

  /**
   * Emite um evento de forma fire-and-forget. Erros em handlers assíncronos são capturados internamente.
   *
   * @param event - Nome do evento ou token tipado.
   * @param payload - Dados a serem passados aos handlers registrados.
   *
   * @example
   * ```ts
   * bus.emit(UserCreated, { id: '1', email: 'a@b.com' });
   * ```
   */
  emit<T>(event: TypedEvent<T>, payload: T): void;
  emit<T>(event: string, payload: T): void;
  emit<T>(event: EventKey<T>, payload: T): void {
    const key = typeof event === 'string' ? event : event.name;
    const current = this.listeners.get(key) ?? [];
    for (const handler of current) {
      try {
        const result = handler(payload);
        // If handler returns a promise, catch its rejection
        if (result && typeof (result as any).catch === 'function') {
          (result as Promise<void>).catch((error) => this.handleError(key, error));
        }
      } catch (error) {
        this.handleError(key, error);
      }
    }
  }

  /**
   * Emite um evento e aguarda todos os handlers completarem. Lança erro se algum handler falhar.
   *
   * @param event - Nome do evento ou token tipado.
   * @param payload - Dados a serem passados aos handlers.
   * @param options - Opções como `continueOnError` para executar todos handlers mesmo com falhas.
   *
   * @example
   * ```ts
   * await bus.emitAsync(OrderPlaced, { orderId: '42' });
   * ```
   */
  async emitAsync<T>(event: TypedEvent<T>, payload: T, options?: EmitAsyncOptions): Promise<void>;
  async emitAsync<T>(event: string, payload: T, options?: EmitAsyncOptions): Promise<void>;
  async emitAsync<T>(event: EventKey<T>, payload: T, options?: EmitAsyncOptions): Promise<void> {
    const key = typeof event === 'string' ? event : event.name;
    const current = this.listeners.get(key) ?? [];

    if (options?.continueOnError) {
      const errors: unknown[] = [];
      for (const handler of current) {
        try {
          await handler(payload);
        } catch (error) {
          errors.push(error);
          this.handleError(key, error);
        }
      }
      if (errors.length > 0) {
        throw new AggregateError(errors, `${errors.length} handler(s) failed for event "${key}"`);
      }
    } else {
      await Promise.all(current.map((handler) => handler(payload)));
    }
  }

  private handleError(event: string, error: unknown): void {
    if (this.onError) {
      this.onError(event, error);
    }
    // Emit internal __error__ event (but don't recurse if it's already __error__)
    if (event !== '__error__') {
      const errorListeners = this.listeners.get('__error__') ?? [];
      for (const listener of errorListeners) {
        try {
          listener({ event, error });
        } catch {
          // Prevent infinite recursion — swallow errors from error handlers
        }
      }
    }
  }
}
