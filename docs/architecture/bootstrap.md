# Bootstrap

Resumo curto

Bootstrap cobre tudo o que acontece entre iniciar o processo e o app aceitar requests.

## Etapas

```txt
entrada
  -> config
  -> createApp
  -> plugin registration
  -> module registration
  -> listen
```

## Explicação

`server.ts` costuma chamar `buildApp()`, que por sua vez chama `createApp()` com os módulos necessários.

## Links relacionados

- [Quick Start](/introduction/quick-start)
- [createApp](/api/create-app)
