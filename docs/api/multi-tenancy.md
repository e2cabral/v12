# Multi-tenancy API

O V12 oferece um middleware `multiTenancy()` que extrai o tenant da request e o registra no container da requisição.

## Middleware `multiTenancy()`

```ts
import { multiTenancy } from '@eddiecbrl/v12';

router.get('/orders', {
  middlewares: [
    multiTenancy({ required: true }),
  ],
  handler: async ({ container }) => {
    const tenantId = container.resolve('TenantId');
    return { tenantId };
  },
});
```

## Opções

- `header` padrão `x-tenant-id`
- `query` padrão `tenantId`
- `cookie`
- `defaultTenant`
- `required`

## Exemplo com header customizado

```ts
multiTenancy({
  header: 'x-v12-tenant',
  required: true,
})
```

## Exemplo com query param

```ts
multiTenancy({
  query: 'workspaceId',
})
```

## O que o middleware faz

Na implementação atual, ele:

1. tenta ler do header
2. tenta ler do query param
3. usa `defaultTenant`, se existir
4. se `required` for `true` e nada foi encontrado, lança erro
5. registra `TenantId` no container da request

## Consumindo `TenantId`

O caminho mais seguro hoje é resolver o token dentro do ciclo da própria request:

```ts
router.get('/orders', {
  middlewares: [multiTenancy({ required: true })],
  handler: async ({ container }) => {
    const tenantId = container.resolve('TenantId');
    return { tenantId };
  },
});
```

## Sobre integração com repositories

Os repositories base aceitam `tenantId` nas opções:

```ts
super(prisma.order, 'orders', { tenantId })
```

Isso permite aplicar filtro de tenant e injetar `tenantId` em creates.

## Limite importante do estado atual

Como `TenantId` é registrado no container da request, a forma mais previsível de usá-lo hoje é na borda da request ou ao instanciar manualmente uma dependência por request.

Se você depender de providers singleton construídos antes do contexto da request, esse valor não aparece magicamente dentro deles.

Ou seja: a capacidade existe, mas o desenho precisa ser consciente.

## Links relacionados

- [Guia de Multi-tenancy & Audit](/guides/multi-tenancy-audit)
- [Database API](/api/database)
