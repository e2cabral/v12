# Testing API

O V12 oferece `createTestingApp()` para facilitar testes de integração com app real, mas sem subir porta TCP.

## `createTestingApp()`

É um wrapper sobre `createApp()` com dois comportamentos principais:

- desabilita logs por padrão
- aceita `overrides` como providers extras

## Assinatura

```ts
createTestingApp(options?: CreateTestingAppOptions): Promise<AppInstance>
```

## Opções

- `modules`
- `overrides`
- qualquer outra opção do `createApp`, exceto `modules` e `providers`

## Exemplo básico

```ts
import { describe, expect, it } from 'vitest';
import { createTestingApp } from '@eddiecbrl/v12';
import { UsersModule } from './users.module.js';

describe('UsersModule', () => {
  it('lists users', async () => {
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

## `overrides`

Use para substituir dependências.

```ts
const app = await createTestingApp({
  modules: [UsersModule],
  overrides: [
    {
      provide: 'ClockService',
      useValue: {
        now: () => new Date('2026-01-01T00:00:00.000Z'),
      },
    },
  ],
});
```

## Exemplo com service mockado

```ts
const app = await createTestingApp({
  modules: [BillingModule],
  overrides: [
    {
      provide: PaymentGateway,
      useValue: {
        process: async () => ({ success: true }),
      },
    },
  ],
});
```

## Como testar HTTP

Use `app.inject()` do Fastify.

```ts
const response = await app.inject({
  method: 'POST',
  url: '/users',
  payload: {
    name: 'Ada',
    email: 'ada@example.com',
  },
});
```

## Por que isso ajuda

- velocidade
- não ocupa porta
- permite testar middleware, validação, DI e resposta HTTP
- facilita mocks pontuais

## Escopo ideal

Use `createTestingApp()` para:

- testes de integração de módulos
- testes de rotas
- testes de autenticação/guards
- validação de bootstrap parcial

Para unitários puros, costuma ser melhor instanciar a classe diretamente.

## Links relacionados

- [Guia de Testes](/guides/testing)
- [createApp](/api/create-app)
