# Storage API

O `StorageService` do V12 fornece uma interface unificada para manipulação de arquivos, permitindo trocar o destino dos arquivos (local, S3, etc.) sem alterar o código da aplicação.

## StorageService

### put

Salva um arquivo no storage.

```ts
const path = await storage.put('avatars/user-1.png', buffer);
```

### get

Recupera o conteúdo de um arquivo.

```ts
const buffer = await storage.get('avatars/user-1.png');
```

### delete

Remove um arquivo do storage.

```ts
await storage.delete('avatars/user-1.png');
```

### exists

Verifica se um arquivo existe.

```ts
const ok = await storage.exists('avatars/user-1.png');
```

### url

Gera a URL pública do arquivo.

```ts
const publicUrl = storage.url('avatars/user-1.png');
```

## Adaptadores

O V12 suporta:

- `LocalStorageAdapter`: Armazena arquivos no sistema de arquivos local.

## Configuração

```ts
import { createApp, StorageService, LocalStorageAdapter } from 'v12';

const app = await createApp({
  providers: [
    {
      provide: StorageService,
      useValue: new StorageService(new LocalStorageAdapter({
        root: './storage',
        baseUrl: 'http://localhost:3000/public'
      }))
    }
  ]
});
```

## Links relacionados

- [createApp](/api/create-app)
- [Multipart Upload](/api/create-app#upload)
