# Request Pipeline

Resumo curto

O request pipeline define como uma chamada HTTP atravessa o framework.

## Diagrama

```mermaid
flowchart TD
  A["Request"] --> B["Global middlewares"]
  B --> C["Module middlewares"]
  C --> D["Route middlewares"]
  D --> E["Zod validation"]
  E --> F["Controller"]
  F --> G["Service"]
  G --> H["Repository"]
  H --> I["Standard response"]
```

## Erros comuns

- autenticação em service quando deveria ser middleware
- validação manual duplicada

## Links relacionados

- [Execution](/concepts/execution)
- [createRouter](/api/create-router)
