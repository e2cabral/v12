# Cache API

O V12 fornece um serviço de cache unificado com suporte a diferentes drivers, permitindo armazenar e recuperar dados rapidamente.

## CacheService

O `CacheService` expõe métodos para gerenciar o cache.

### get

Busca um item do cache. Retorna `null` se não encontrado.

```ts
const user = await cache.get<User>('user:123');
```

### set

Armazena um item no cache.

```ts
await cache.set('user:123', userData, 3600); // 1 hora de TTL
```

### delete

Remove um item do cache.

```ts
await cache.delete('user:123');
```

### clear

Limpa todo o cache (use com cautela).

```ts
await cache.clear();
```

### remember

Tenta buscar do cache. Se não encontrar, executa a factory, salva o resultado no cache e o retorna. É o padrão mais comum de cache lateral.

```ts
const user = await cache.remember('user:123', 3600, async () => {
  return repository.findById('123');
});
```

## Adaptadores

O V12 suporta:

- `MemoryCacheAdapter`: Armazenamento em memória (volátil, ideal para testes ou caches muito pequenos).
- `RedisCacheAdapter`: Armazenamento no Redis (persistente e compartilhado).

## Configuração

Você pode registrar o `CacheService` no `createApp` ou em um módulo:

```ts
import { createApp, CacheService, RedisCacheAdapter } from 'v12';

const app = await createApp({
  providers: [
    {
      provide: CacheService,
      useFactory: (container) => {
        const redis = container.resolve('Redis');
        return new CacheService(new RedisCacheAdapter(redis));
      }
    }
  ]
});
```
