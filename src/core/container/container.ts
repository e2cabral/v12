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

/**
 * Um provider de DI — pode ser uma classe, valor, factory ou referência com alias.
 *
 * @example
 * ```ts
 * const providers: Provider[] = [
 *   UsersService,
 *   { provide: 'API_KEY', useValue: '123' },
 *   { provide: Logger, useFactory: (c) => new Logger(c.resolve(Config)) },
 * ];
 * ```
 */
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

function tokenName(token: Token): string {
  if (typeof token === 'function') return token.name || 'Anonymous';
  if (typeof token === 'symbol') return token.toString();
  return token;
}

type RegistryRecord = {
  provider: Provider;
  scope: 'singleton' | 'request';
};

/**
 * Container de injeção de dependências com suporte a singleton, request-scope, hierarquia e detecção de ciclos.
 *
 * @example
 * ```ts
 * const container = new Container();
 * container.register(UsersService);
 * const service = container.resolve(UsersService);
 * ```
 */
export class Container {
  private registry = new Map<Token, RegistryRecord>();
  private singletons = new Map<Token, unknown>();

  constructor(private readonly parent?: Container) {}

  /**
   * Registra um provider no container.
   *
   * @param provider - Classe, value provider, factory provider ou class provider.
   *
   * @example
   * ```ts
   * container.register(UsersService);
   * container.register({ provide: 'DB_URL', useValue: 'postgres://...' });
   * ```
   */
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

  /**
   * Cria um container filho que herda providers request-scoped e delega resolução ao pai.
   *
   * @returns Um novo Container filho.
   *
   * @example
   * ```ts
   * const child = container.createChild();
   * const scoped = child.resolve(RequestScopedService);
   * ```
   */
  createChild(): Container {
    const child = new Container(this);
    // Copy request-scoped providers to child so they get fresh instances
    for (const [token, record] of this.registry.entries()) {
      if (record.scope === 'request') {
        child.registry.set(token, { ...record });
      }
    }
    return child;
  }

  /**
   * Verifica se um token está registrado neste container ou em seus ancestrais.
   *
   * @param token - Token (classe, string ou symbol) a verificar.
   * @returns `true` se o provider existir na hierarquia.
   *
   * @example
   * ```ts
   * if (container.has(UsersService)) {
   *   const svc = container.resolve(UsersService);
   * }
   * ```
   */
  has(token: Token): boolean {
    if (this.registry.has(token)) return true;
    if (this.parent) return this.parent.has(token);
    return false;
  }

  /**
   * Resolve uma instância a partir do token registrado, instanciando dependências recursivamente.
   *
   * @param token - Token (classe, string ou symbol) do provider a resolver.
   * @returns A instância resolvida com tipo inferido.
   *
   * @example
   * ```ts
   * const service = container.resolve(UsersService);
   * ```
   */
  resolve<T>(token: Token<T>): T {
    return this.resolveInternal(token, []);
  }

  private resolveInternal<T>(token: Token<T>, resolvePath: Token[]): T {
    // Circular dependency detection
    if (resolvePath.includes(token)) {
      const cyclePath = [...resolvePath, token].map(tokenName).join(' \u2192 ');
      throw new Error(`Circular dependency detected: ${cyclePath}`);
    }

    const local = this.registry.get(token);
    if (local) {
      return this.instantiate(token, local, resolvePath) as T;
    }

    if (this.parent) {
      return this.parent.resolveInternal(token, resolvePath);
    }

    if (typeof token === 'function') {
      return this.instantiate(
        token,
        {
          provider: { provide: token, useClass: token },
          scope: 'singleton',
        },
        resolvePath,
      ) as T;
    }

    const currentPath = [...resolvePath, token];
    const pathStr = currentPath.map(tokenName).join(' \u2192 ');
    throw new Error(
      `Cannot resolve "${tokenName(token)}". Resolution path: ${pathStr}. No provider registered.`,
    );
  }

  private instantiate(token: Token, record: RegistryRecord, resolvePath: Token[]): unknown {
    if (this.singletons.has(token)) {
      return this.singletons.get(token);
    }

    const instance = this.buildInstance(record.provider, [...resolvePath, token]);
    // Cache for both singleton and request scope
    // For singletons in parent: lives forever
    // For request-scoped in child: lives until child is GC'd (end of request)
    this.singletons.set(token, instance);

    return instance;
  }

  private buildInstance(provider: Provider, resolvePath: Token[]): unknown {
    if (typeof provider === 'function') {
      return this.instantiateClass(provider, resolvePath);
    }

    if (isValueProvider(provider)) {
      return provider.useValue;
    }

    if (isFactoryProvider(provider)) {
      return provider.useFactory(this);
    }

    if (isClassProvider(provider)) {
      return this.instantiateClass(provider.useClass, resolvePath);
    }

    throw new Error('Unsupported provider');
  }

  private instantiateClass<T>(Target: Constructor<T>, resolvePath: Token[]): T {
    const inject = (Target as Constructor<T> & { inject?: Token[] }).inject ?? [];
    const deps = inject.map((token) => this.resolveInternal(token, resolvePath));
    return new Target(...deps);
  }
}
