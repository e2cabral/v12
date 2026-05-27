# Testing API



O V12 facilita a escrita de testes de integração e E2E através do utilitário `createTestingApp`, que permite configurar um ambiente controlado com substituição de dependências.

## createTestingApp

Esta função é um wrapper sobre o `createApp` que desabilita logs por padrão e permite sobrescrever providers.

### Assinatura

```ts
createTestingApp(options: CreateTestingAppOptions): Promise<AppInstance>
```

### Opções

- `modules`: Módulos a serem carregados no teste.
- `overrides`: Lista de providers que irão substituir as implementações reais.
- `...rest`: Aceita todas as outras opções do `createApp`.

## Exemplo de Teste de Integração

Usando `vitest` e a biblioteca `supertest` (ou o método `.inject()` do Fastify):

```ts
import { describe, it, expect } from 'vitest';
import { createTestingApp } from 'v12';
import { UsersModule } from './users.module.js';

describe('UsersModule', () => {
  it('should list users', async () => {
    const app = await createTestingApp({
      modules: [UsersModule],
      overrides: [
        { provide: 'Database', useValue: mockDatabase }
      ]
    });

    const response = await app.inject({
      method: 'GET',
      url: '/users'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: [] });
  });
});
```

## Substituindo Dependências (Overrides)

O segredo para testes rápidos e isolados é o uso de `overrides`. Você pode substituir qualquer token registrado no container global por um Mock ou Stub.

```ts
const app = await createTestingApp({
  modules: [MyModule],
  overrides: [
    { provide: MailService, useClass: MemoryMailAdapter }
  ]
});
```

## Links relacionados

- [Guia de Testes](/guides/testing)
- [createApp](/api/create-app)
