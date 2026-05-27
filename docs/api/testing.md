# Testing API

Resumo curto

`createTestingApp()` reduz fricção para testes de integração.

## Exemplo

```ts
const app = await createTestingApp({
  modules: [UsersModule],
});
```

## Casos reais

- testar rotas
- testar guards
- testar fluxo com providers reais

## Links relacionados

- [Testing](/testing/)
- [Guide de testes](/guides/testing)
