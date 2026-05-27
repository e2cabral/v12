# Execution

Resumo curto

Execution é a trilha completa entre entrada HTTP e resposta serializada.

## Fluxo interno

```txt
entrada
  -> transformação
  -> execução
  -> resultado
```

## Exemplo completo

```txt
request
  -> validation
  -> guard
  -> controller
  -> service
  -> repository
  -> ok()
```

## Links relacionados

- [Request Pipeline](/architecture/request-pipeline)
- [Errors](/api/errors)
