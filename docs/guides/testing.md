# Guia de Testes

Testar aplicações V12 fica bem direto quando você separa unitários de integrações e usa `createTestingApp()` nos pontos certos.

## Estratégia simples

### Teste unitário

Instancie a classe diretamente e use mocks leves.

```ts
import { describe, expect, it, vi } from 'vitest';

describe('UsersService', () => {
  it('creates a user', async () => {
    const mockRepo = {
      create: vi.fn().mockResolvedValue({ id: '1', name: 'Ada' }),
    };

    const service = new UsersService(mockRepo as any);
    const result = await service.create({ name: 'Ada' });

    expect(result.id).toBe('1');
    expect(mockRepo.create).toHaveBeenCalled();
  });
});
```

### Teste de integração HTTP

Use `createTestingApp()` e `app.inject()`.

```ts
import { describe, expect, it } from 'vitest';
import { createTestingApp } from '@eddiecbrl/v12';

describe('Users API', () => {
  it('GET /users returns 200', async () => {
    const app = await createTestingApp({
      modules: [UsersModule],
    });

    const response = await app.inject({
      method: 'GET',
      url: '/users',
    });

    expect(response.statusCode).toBe(200);
  });
});
```

## Quando usar `createTestingApp()`

Use quando você quer testar:

- rotas
- middlewares
- guards
- validação
- DI
- integração entre controller, service e repository

## `overrides`

`createTestingApp()` aceita `overrides` para trocar dependências.

```ts
const app = await createTestingApp({
  modules: [BillingModule],
  overrides: [
    {
      provide: PaymentGateway,
      useValue: {
        process: vi.fn().mockResolvedValue({ success: true }),
      },
    },
  ],
});
```

## Dicas práticas

- use unitários para regra de negócio
- use integração para garantir comportamento HTTP real
- prefira `app.inject()` a subir servidor em porta
- limpe dados quando usar banco real

## Links relacionados

- [Testing API](/api/testing)
- [Vitest](https://vitest.dev/)
