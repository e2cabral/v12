# Configuration

Resumo curto

Configuração no `v12` é centralizada, validada e tipada.

## Quando usar

Use esta página para ambiente, portas, chaves e parâmetros operacionais.

## Exemplo rápido

```ts
const config = defineConfig({
  PORT: env.number().default(3000),
});
```

## Tabela

| Nome | Tipo | Default | Descrição |
| --- | --- | --- | --- |
| `PORT` | `number` | `3000` | Porta HTTP |
| `HOST` | `string` | `0.0.0.0` | Host de bind |

## Boas práticas

- valide tudo cedo
- mantenha `process.env` fora da aplicação de negócio

## Links relacionados

- [Config API](/api/config)
- [Instalação](/introduction/installation)
