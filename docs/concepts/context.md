# Context

Resumo curto

Context é o conjunto de dados disponíveis durante a execução de uma rota: `request`, `reply` e `container`.

## Quando usar

Leia esta página ao criar middlewares e handlers.

## Conceito

O `RequestContext` do `v12` encapsula:

- request
- reply
- container

## Exemplo rápido

```ts
handler: ({ request, container }) => {
  return container.resolve(UsersController).get({ request, container } as any);
}
```

## Explicação completa

O context permite manter a API de rota simples sem expor detalhes internos do framework em todos os lugares.

## Erros comuns

- mutar o contexto sem necessidade
- vazar dados de auth de forma implícita

## Links relacionados

- [Execution](/concepts/execution)
- [Request Pipeline](/architecture/request-pipeline)
