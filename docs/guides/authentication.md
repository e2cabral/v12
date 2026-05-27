# Autenticação

Resumo curto

Este guia mostra como usar JWT, API key e role guard no `v12`.

## Objetivo

Proteger endpoints sem misturar auth com regra de domínio.

## Exemplo

```ts
router.get('/admin', {
  middlewares: [
    jwt({ secret: 'secret' }),
    role('admin'),
  ],
  handler: async () => ({ ok: true }),
});
```

## Boas práticas

- mantenha segredo fora do código
- use role guard após autenticação

## Problemas comuns

- enviar token sem prefixo `Bearer`

## Links relacionados

- [Auth API](/api/auth)
- [Security](/security/)
