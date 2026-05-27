# Containers

Resumo curto

O container do `v12` resolve providers, valores e factories, e pode criar escopos filhos por request.

## Quando usar

Leia esta página ao definir serviços, repositories ou extensões do core.

## Conceito

O container serve para:

- registrar dependências
- resolver dependências
- desacoplar criação de objetos

## Exemplo rápido

```ts
container.register({ provide: 'Logger', useValue: logger });
container.resolve(UsersService);
```

## Explicação completa

O modelo atual suporta:

- classe
- valor
- factory

Também permite `createChild()` para cenários de request.

## Diagrama textual

```txt
Root Container
  -> global providers
  -> module providers
  -> request child container
```

## Erros comuns

- token não registrado
- depender de detalhes concretos em vez de token estável

## Boas práticas

- use tokens explícitos para adapters
- mantenha serviços focados

## FAQ

### O container já tem escopo avançado?

Ainda não. O modelo atual é simples e previsível.

## Links relacionados

- [Dependency Graph](/concepts/dependency-graph)
- [Dependency Injection avançada](/advanced/dependency-injection)
