# Banco de Dados

Resumo curto

O `v12` não prende sua aplicação a um banco ou ORM específico.

## Objetivo

Explicar como integrar persistência preservando o boundary do repository.

## Estratégia recomendada

```txt
Service
  -> Repository interface
  -> Repository implementation
  -> Database adapter
```

## Boas práticas

- use tokens de repository
- esconda o ORM atrás do repository

## Limitações atuais

Adapters oficiais ainda estão no roadmap.

## Links relacionados

- [Repository pattern nos conceitos](/concepts/services)
- [Roadmap](/roadmap/)
