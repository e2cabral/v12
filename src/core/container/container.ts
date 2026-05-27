export type Token<T = unknown> = string | symbol | Constructor<T>;

export type Constructor<T = unknown> = new (...args: any[]) => T;

export type ClassProvider<T = unknown> = {
  provide: Token<T>;
  useClass: Constructor<T>;
  scope?: 'singleton' | 'request';
};

export type ValueProvider<T = unknown> = {
  provide: Token<T>;
  useValue: T;
};

export type FactoryProvider<T = unknown> = {
  provide: Token<T>;
  useFactory: (container: Container) => T;
  scope?: 'singleton' | 'request';
};

export type Provider<T = unknown> =
  | Constructor<T>
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>;

const isClassProvider = (value: Provider): value is ClassProvider =>
  typeof value === 'object' && value !== null && 'useClass' in value;

const isValueProvider = (value: Provider): value is ValueProvider =>
  typeof value === 'object' && value !== null && 'useValue' in value;

const isFactoryProvider = (value: Provider): value is FactoryProvider =>
  typeof value === 'object' && value !== null && 'useFactory' in value;

type RegistryRecord = {
  provider: Provider;
  scope: 'singleton' | 'request';
};

export class Container {
  private registry = new Map<Token, RegistryRecord>();
  private singletons = new Map<Token, unknown>();

  constructor(private readonly parent?: Container) {}

  register(provider: Provider) {
    if (typeof provider === 'function') {
      this.registry.set(provider, {
        provider: { provide: provider, useClass: provider },
        scope: 'singleton',
      });
      return;
    }

    const scope =
      (isClassProvider(provider) || isFactoryProvider(provider)) && provider.scope
        ? provider.scope
        : 'singleton';
    this.registry.set(provider.provide, { provider, scope });
  }

  registerMany(providers: Provider[] = []) {
    for (const provider of providers) {
      this.register(provider);
    }
  }

  createChild() {
    return new Container(this);
  }

  resolve<T>(token: Token<T>): T {
    const local = this.registry.get(token);
    if (local) {
      return this.instantiate(token, local) as T;
    }

    if (this.parent) {
      return this.parent.resolve(token);
    }

    if (typeof token === 'function') {
      return this.instantiate(token, {
        provider: { provide: token, useClass: token },
        scope: 'singleton',
      }) as T;
    }

    throw new Error(`Provider not found for token: ${String(token)}`);
  }

  private instantiate(token: Token, record: RegistryRecord): unknown {
    if (record.scope === 'singleton' && this.singletons.has(token)) {
      return this.singletons.get(token);
    }

    const instance = this.buildInstance(record.provider);
    if (record.scope === 'singleton') {
      this.singletons.set(token, instance);
    }

    return instance;
  }

  private buildInstance(provider: Provider): unknown {
    if (typeof provider === 'function') {
      return this.instantiateClass(provider);
    }

    if (isValueProvider(provider)) {
      return provider.useValue;
    }

    if (isFactoryProvider(provider)) {
      return provider.useFactory(this);
    }

    if (isClassProvider(provider)) {
      return this.instantiateClass(provider.useClass);
    }

    throw new Error('Unsupported provider');
  }

  private instantiateClass<T>(Target: Constructor<T>): T {
    const inject = (Target as Constructor<T> & { inject?: Token[] }).inject ?? [];
    const deps = inject.map((token) => this.resolve(token));
    return new Target(...deps);
  }
}
