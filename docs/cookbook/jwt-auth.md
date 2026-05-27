# Autenticação JWT

Problema

Quero proteger endpoints com token.

Solução

Use `jwt()` como middleware.

Implementação

```ts
middlewares: [jwt({ secret: 'secret' })]
```
