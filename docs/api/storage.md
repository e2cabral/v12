# Storage API

O V12 oferece um `StorageService` pequeno com adapter pluggável.

## Peças disponíveis

- `StorageService`
- `StorageAdapter`
- `LocalStorageAdapter`

## `StorageService`

Expõe:

- `put(path, content)`
- `get(path)`
- `delete(path)`
- `exists(path)`
- `url(path)`

## Exemplo básico

```ts
import { LocalStorageAdapter, StorageService } from '@eddiecbrl/v12';

const storage = new StorageService(
  new LocalStorageAdapter('./storage', 'http://localhost:3000/storage'),
);

await storage.put('avatars/user-1.txt', 'hello');
const file = await storage.get('avatars/user-1.txt');
```

## `put()`

```ts
const path = await storage.put('avatars/user-1.png', buffer);
```

## `get()`

```ts
const buffer = await storage.get('avatars/user-1.png');
```

Retorna `Buffer | null`.

## `delete()`

```ts
await storage.delete('avatars/user-1.png');
```

## `exists()`

```ts
const ok = await storage.exists('avatars/user-1.png');
```

## `url()`

```ts
const publicUrl = storage.url('avatars/user-1.png');
```

## `LocalStorageAdapter`

O adapter local:

- grava no filesystem
- cria diretórios automaticamente
- devolve URL a partir de `baseUrl`

## Construtor

```ts
new LocalStorageAdapter(rootDir?, baseUrl?)
```

Defaults:

- `rootDir = <cwd>/storage`
- `baseUrl = /storage`

## Exemplo com provider

```ts
import {
  createApp,
  LocalStorageAdapter,
  StorageService,
} from '@eddiecbrl/v12';

const app = await createApp({
  providers: [
    {
      provide: StorageService,
      useValue: new StorageService(
        new LocalStorageAdapter('./storage', 'http://localhost:3000/storage'),
      ),
    },
  ],
});
```

## Exemplo em service

```ts
class AvatarsService {
  static inject = [StorageService] as const;

  constructor(private readonly storage: StorageService) {}

  async saveAvatar(userId: string, content: Buffer) {
    const path = `avatars/${userId}.png`;
    await this.storage.put(path, content);
    return {
      path,
      url: this.storage.url(path),
    };
  }
}
```

## Boas práticas

- use paths namespaced por domínio
- não exponha paths internos quando uma URL pública for suficiente
- centralize o `StorageService` no bootstrap

## Links relacionados

- [createApp](/api/create-app)
