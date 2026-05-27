# Multi-tenancy API

O V12 fornece suporte nativo para arquiteturas multi-tenant, permitindo o isolamento de dados de forma transparente através de middlewares e repositórios.

## Middleware `multiTenancy`

Este middleware extrai o identificador do tenant da requisição e o registra no container de DI da requisição sob o token `TenantId`.

### Uso

```ts
import { multiTenancy } from 'v12';

router.get('/orders', {
  middlewares: [multiTenancy({ required: true })],
  handler: async ({ container }) => {
    // ...
  }
});
```

### Opções (`MultiTenancyOptions`)

- `header`: (Opcional) Nome do header HTTP (padrão: `x-tenant-id`).
- `query`: (Opcional) Nome do parâmetro de busca (padrão: `tenantId`).
- `cookie`: (Opcional) Nome do cookie.
- `defaultTenant`: (Opcional) Valor usado caso nenhum seja encontrado.
- `required`: (Opcional) Se `true`, lança erro se o tenant não for identificado.

## Token `TenantId`

O identificador do tenant é registrado como um `string` no container. Você pode injetá-lo em qualquer serviço ou repositório:

```ts
import { Inject } from 'v12';

export class MyService {
  constructor(@Inject('TenantId') private tenantId: string) {}
}
```

## Integração com Repositórios

Os repositórios base do V12 (`PrismaRepository`, etc.) aceitam um `tenantId` no construtor. Se fornecido, todas as operações automáticas (find, findAll, create, update, delete) aplicarão um filtro por coluna `tenantId`.

```ts
export class OrdersRepository extends PrismaRepository<Order> {
  constructor(prisma: PrismaClient, @Inject('TenantId') tenantId: string) {
    super(prisma.order, 'orders', { tenantId });
  }
}
```
