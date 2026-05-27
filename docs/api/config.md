# Config API

Resumo curto

O módulo de configuração do `v12` centraliza schema, parsing e defaults.

## Assinatura

```ts
defineConfig(shape)
env.string()
env.number()
env.boolean()
```

## Exemplo

```ts
const config = defineConfig({
  PORT: env.number().default(3000),
});
```

## Links relacionados

- [Configuration](/concepts/configuration)
