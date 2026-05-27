# Plugins

Resumo curto

Plugins permitem estender o `v12` sem acoplar comportamento transversal ao core da aplicação.

## Objetivo

Encapsular concerns como docs, auth, observabilidade e adapters.

## Exemplo

```ts
await app.use(pluginOpenApi(modules, {
  title: 'V12 API',
  version: '1.0.0',
}));
```

## Links relacionados

- [Plugins API](/api/plugins)
- [Plugins](/plugins/)
