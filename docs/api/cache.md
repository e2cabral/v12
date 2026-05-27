# Cache API

O V12 oferece um `CacheService` pequeno e adaptável, com suporte a memória e Redis.

## Peças disponíveis

- `CacheService`
- `MemoryCacheAdapter`
- `RedisCacheAdapter`

## `CacheService`

O serviço expõe:

- `get(key)`
- `set(key, value, ttlSeconds?)`
- `delete(key)`
- `clear()`
- `remember(key, ttlSeconds, factory)`

## Exemplo básico

```ts
import { CacheService, MemoryCacheAdapter } from '@eddiecbrl/v12';

const cache = new CacheService(new MemoryCacheAdapter());

await cache.set('user:123', { id: '123', name: 'Ada' }, 3600);
const user = await cache.get<{ id: string; name: string }>('user:123');
```

## `get()`

Retorna valor ou `null`.

```ts
const user = await cache.get('user:123');
```

## `set()`

Armazena um valor com TTL opcional em segundos.

```ts
await cache.set('user:123', userData, 3600);
```

## `delete()`

```ts
await cache.delete('user:123');
```

## `clear()`

```ts
await cache.clear();
```

## `remember()`

Esse é o padrão mais útil no dia a dia.

```ts
const profile = await cache.remember('user:123', 300, async () => {
  return usersRepository.findById('123');
});
```

Fluxo:

1. tenta ler do cache
2. se encontrar, retorna
3. se não encontrar, executa a factory
4. salva o resultado
5. retorna o resultado

## `MemoryCacheAdapter`

Armazena tudo em memória do processo.

Bom para:

- testes
- desenvolvimento
- cache local pequeno

Limites:

- não é compartilhado entre instâncias
- é perdido quando o processo reinicia

## Exemplo

```ts
import { CacheService, MemoryCacheAdapter } from '@eddiecbrl/v12';

const cache = new CacheService(new MemoryCacheAdapter());
```

## `RedisCacheAdapter`

Usa Redis como backend.

Bom para:

- produção
- múltiplas instâncias
- cache compartilhado

## Exemplo

```ts
import { CacheService, RedisCacheAdapter } from '@eddiecbrl/v12';

const redis = container.resolve('Redis');
const cache = new CacheService(new RedisCacheAdapter(redis));
```

O adapter serializa objetos com `JSON.stringify` e tenta `JSON.parse` no `get()`.

## Registrando no container

### Com Redis da própria app

```ts
const app = await createApp({
  redis: { url: 'redis://localhost:6379' },
  providers: [
    {
      provide: CacheService,
      useFactory: (container) => {
        const redis = container.resolve('Redis');
        return new CacheService(new RedisCacheAdapter(redis));
      },
    },
  ],
});
```

### Com cache em memória

```ts
const app = await createApp({
  providers: [
    {
      provide: CacheService,
      useValue: new CacheService(new MemoryCacheAdapter()),
    },
  ],
});
```

## Exemplo em service

```ts
class UsersService {
  static inject = [UsersRepository, CacheService] as const;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cache: CacheService,
  ) {}

  async findById(id: string) {
    return this.cache.remember(`users:${id}`, 300, async () => {
      return this.usersRepository.findById(id);
    });
  }
}
```

## Boas práticas

- use chaves previsíveis e namespaced
- prefira `remember()` para leitura com cache lateral
- use memória para local/dev e Redis para produção
- escolha TTL coerente com a volatilidade do dado

## Links relacionados

- [createApp](/api/create-app)
- [Resiliência](/api/resilience)
