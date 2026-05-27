# Auth API

Resumo curto

O `v12` já oferece primitives para JWT, API key e role guards.

## Recursos

- `signJwt`
- `verifyJwt`
- `extractBearerToken`
- `verifyApiKey`
- `jwt()`
- `apiKey()`
- `role()`

## Exemplo

```ts
router.get('/admin', {
  middlewares: [jwt({ secret }), role('admin')],
  handler: async () => ({ ok: true }),
});
```

## Segurança

Use auth como middleware, não como lógica espalhada em services.

## Links relacionados

- [Guia de autenticação](/guides/authentication)
- [Security](/security/)
