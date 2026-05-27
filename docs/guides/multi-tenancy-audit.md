# Multi-tenancy e Auditoria

Este guia junta dois temas que costumam andar próximos em sistemas SaaS: isolamento por tenant e rastreabilidade de ações.

## Multi-tenancy

No V12, o ponto de entrada é o middleware `multiTenancy()`.

## Exemplo básico

```ts
import { multiTenancy } from '@eddiecbrl/v12';

router.get('/orders', {
  middlewares: [
    multiTenancy({
      header: 'x-v12-tenant',
      required: true,
    }),
  ],
  handler: async ({ container }) => {
    const tenantId = container.resolve('TenantId');
    return { tenantId };
  },
});
```

## O que ele resolve

- extrai tenant da request
- registra `TenantId` no container da request
- permite que a borda HTTP saiba qual tenant está ativo

## Cuidados práticos

No estado atual do framework, o uso mais previsível do `TenantId` é:

- dentro do handler
- em middlewares
- na criação manual de dependência por request

Isso evita depender de providers singleton para carregar contexto que só existe na request atual.

## Exemplo com repository construído por request

```ts
router.get('/orders', {
  middlewares: [multiTenancy({ required: true })],
  handler: async ({ container }) => {
    const tenantId = container.resolve('TenantId');
    const prisma = container.resolve('PrismaClient');
    const auditService = container.resolve('AuditService');

    const repo = new OrdersRepository(prisma.order, 'orders', {
      tenantId,
      auditService,
    });

    return repo.findAll();
  },
});
```

## Auditoria

O `AuditService` é registrado no bootstrap com o token:

```txt
'AuditService'
```

## Log manual

```ts
class AuthService {
  static inject = ['AuditService'] as const;

  constructor(private readonly audit: any) {}

  async login(userId: string, ip: string) {
    await this.audit.log({
      action: 'LOGIN',
      resource: 'auth',
      userId,
      metadata: { ip },
    });
  }
}
```

## Auditoria automática em repository

Se um repository base receber `auditService`, os hooks padrão podem registrar:

- `CREATE`
- `UPDATE`
- `DELETE`

```ts
class OrdersRepository extends PrismaRepository<any> {
  constructor(model: any, options: { tenantId?: string; auditService?: any }) {
    super(model, 'orders', options);
  }
}
```

## Combinação dos dois

Um fluxo bastante comum é:

1. middleware resolve o tenant
2. handler cria ou usa dependência sensível ao tenant
3. repository aplica filtro de tenant
4. repository registra auditoria de CRUD

## Boas práticas

- trate tenant como contexto obrigatório onde fizer sentido
- não misture dados entre tenants por defaults ambíguos
- audite ações críticas de autenticação e alteração
- registre `resource`, `resourceId` e `userId` sempre que puder

## Links relacionados

- [Multi-tenancy API](/api/multi-tenancy)
- [Audit API](/api/audit)
- [Database API](/api/database)
