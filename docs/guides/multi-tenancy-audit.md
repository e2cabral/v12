# Multi-tenancy e Auditoria

O V12 fornece suporte nativo para arquiteturas multi-tenant e rastreamento de alterações através de auditoria automática.

## Multi-tenancy

O multi-tenancy no V12 é implementado através do isolamento de dados no nível do banco de dados (geralmente usando uma coluna `tenantId`).

### 1. Middleware de Multi-tenancy

Primeiro, registre o middleware no seu módulo ou rota. Ele extrairá o ID do tenant da requisição e o registrará no container de DI.

```ts
import { multiTenancy } from 'v12';

router.get('/orders', {
  middlewares: [multiTenancy({ required: true })],
  handler: async ({ container }) => {
    const repo = container.resolve(OrdersRepository);
    return repo.findAll();
  }
});
```

Opções do `multiTenancy`:
- `header`: Nome do header (padrão: `x-tenant-id`).
- `query`: Nome do parâmetro de busca (padrão: `tenantId`).
- `cookie`: Nome do cookie.
- `defaultTenant`: Valor padrão caso não seja enviado.
- `required`: Lança erro se o ID do tenant não for encontrado.

### 2. Repositórios Multi-tenant

Para que o filtro de tenant seja aplicado automaticamente, o seu repositório deve receber o `tenantId` no construtor.

```ts
import { PrismaRepository, Inject } from 'v12';

export class OrdersRepository extends PrismaRepository<Order> {
  constructor(
    prisma: PrismaClient,
    @Inject('TenantId') tenantId: string
  ) {
    super(prisma.order, 'orders', { tenantId });
  }
}
```

O `PrismaRepository` (e outros adaptadores) usará esse `tenantId` para:
- Filtrar todas as consultas (`find`, `findAll`, etc.).
- Definir automaticamente o `tenantId` em novas criações.

---

## Auditoria

O `AuditService` permite registrar ações importantes realizadas no sistema.

### 1. Configurando a Auditoria

O repositório pode receber o `AuditService` opcionalmente para automatizar os logs de CRUD.

```ts
import { AuditService } from 'v12';

export class OrdersRepository extends PrismaRepository<Order> {
  constructor(
    prisma: PrismaClient,
    auditService: AuditService
  ) {
    super(prisma.order, 'orders', { auditService });
  }
}
```

### 2. Hooks de Auditoria

Ao usar as operações padrão do repositório, os seguintes logs são gerados:
- `CREATE`: Registra os novos dados.
- `UPDATE`: Registra os dados atualizados.
- `DELETE`: Registra a remoção.

### 3. Log Manual

Você também pode registrar eventos de auditoria manualmente.

```ts
await auditService.log({
  action: 'LOGIN',
  resource: 'auth',
  userId: user.id,
  metadata: { ip: request.ip }
});
```

## Estrutura do Log de Auditoria

Cada entrada de auditoria contém:
- `action`: Ação realizada.
- `resource`: Nome do recurso (ex: 'orders').
- `resourceId`: ID do registro afetado.
- `userId`: ID do usuário que realizou a ação.
- `previousData`: Estado anterior (opcional).
- `newData`: Novo estado (opcional).
- `timestamp`: Data e hora do evento.

Por padrão, o V12 envia esses logs para o sistema de logging estruturado (Pino), mas você pode estender o `AuditService` para salvar em uma tabela específica do banco de dados.
