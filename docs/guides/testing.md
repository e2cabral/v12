# Testes

Resumo curto

O `v12` foi desenhado para favorecer testes de integração desde cedo.

## Objetivo

Testar comportamento real sem excesso de boilerplate.

## Exemplo

```ts
const app = await createTestingApp({
  modules: [UsersModule],
});
```

## Tipos de teste

- unit
- integration
- e2e
- contract

## Problemas comuns

- mockar cedo demais
- testar implementação em vez de comportamento

## Links relacionados

- [Testing API](/api/testing)
- [Cookbook CRUD](/cookbook/crud)
