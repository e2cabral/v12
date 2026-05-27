# Guia de Testes

Testar aplicações V12 é simples e eficiente graças à injeção de dependência e ao utilitário `createTestingApp`.

## Tipos de Teste

### Testes Unitários

Focam em testar uma única classe ou função isoladamente. Use mocks para as dependências.

```ts
import { describe, it, expect, vi } from 'vitest';
import { UsersService } from './users.service';

describe('UsersService', () => {
  it('deve criar um usuário', async () => {
    const mockRepo = { create: vi.fn().mockResolvedValue({ id: 1 }) };
    const service = new UsersService(mockRepo as any);
    
    const result = await service.create({ name: 'João' });
    
    expect(result.id).toBe(1);
    expect(mockRepo.create).toHaveBeenCalled();
  });
});
```

### Testes de Integração (API)

Testam a integração entre múltiplos componentes, geralmente disparando requisições HTTP reais contra uma instância da aplicação.

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createTestingApp } from 'v12';
import { AppModule } from '../src/app.module';

describe('Users API', () => {
  let app;

  beforeAll(async () => {
    app = await createTestingApp({
      modules: [AppModule],
      // Você pode sobrescrever providers aqui (ex: usar banco em memória)
    });
  });

  it('GET /users deve retornar 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/users'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toBeInstanceOf(Array);
  });
});
```

## createTestingApp

O `createTestingApp` é um wrapper sobre o `createApp` que:
1. Desabilita logs barulhentos por padrão.
2. Facilita a sobrescrita de `providers` para uso de mocks ou stubs.
3. Não inicia o servidor em uma porta TCP (usa o `inject` do Fastify para performance).

## Sobrescrevendo Dependências

Uma das maiores vantagens do V12 é a facilidade de trocar um serviço real por um mock durante os testes.

```ts
const app = await createTestingApp({
  modules: [BillingModule],
  providers: [
    { 
      provide: PaymentGateway, 
      useValue: { process: vi.fn().mockResolvedValue({ success: true }) } 
    }
  ]
});
```

## Melhores Práticas

- **Limpeza de Dados**: Se estiver usando um banco de dados real nos testes de integração, certifique-se de limpar os dados entre os testes.
- **Evite Testar Implementação**: Foque em testar o comportamento e as saídas, não como o código está escrito internamente.
- **Use Factory Functions**: Crie funções auxiliares para gerar dados de teste repetitivos.

## Links relacionados

- [Testing API Reference](/api/testing)
- [Vitest](https://vitest.dev/)
