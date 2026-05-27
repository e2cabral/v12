# Plugins API

Resumo curto

Plugins são a unidade de extensão do app no `v12`.

## Assinatura

```ts
definePlugin(name, register)
app.use(plugin)
```

## Exemplo

```ts
await app.use(pluginOpenApi(modules, {
  title: 'V12 API',
  version: '1.0.0',
}));
```

## Boas práticas

- plugins devem encapsular cross-cutting concerns
- plugins não devem violar boundaries de feature

## Links relacionados

- [Plugins section](/plugins/)
