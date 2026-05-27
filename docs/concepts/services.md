# Services

Resumo curto

Services concentram regra de negócio e orquestram o fluxo da feature.

## Quando usar

Sempre que uma operação passar de simples leitura/escrita HTTP.

## Conceito

Services devem:

- validar regras
- orquestrar repositories
- emitir eventos
- lançar erros do domínio/aplicação

## Exemplo rápido

```ts
export class UsersService {
  async createUser(input: CreateUserInput) {
    return this.repository.create(input);
  }
}
```

## Explicação completa

No `v12`, controller não é o lugar da regra. O service existe para manter o domínio centralizado e testável.

## Anti-patterns

- service sabendo detalhes de `reply`
- service acoplando a schema HTTP

## Links relacionados

- [Controllers no fluxo](/architecture/request-pipeline)
- [Services vs Controllers](/guides/first-application)
