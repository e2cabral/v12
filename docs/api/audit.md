# Audit API

O `AuditService` é responsável por registrar ações importantes realizadas no sistema para fins de conformidade, rastreabilidade e segurança.

## AuditService

Injetado automaticamente se habilitado ou registrado no container.

### Métodos

#### log(entry: AuditEntry)

Registra uma nova entrada de auditoria. Por padrão, as entradas são enviadas para o Logger estruturado do framework.

```ts
import { AuditService } from 'v12';

export class MyService {
  constructor(private audit: AuditService) {}

  async process() {
    await this.audit.log({
      action: 'UPDATE',
      resource: 'orders',
      resourceId: '123',
      userId: 'user-456',
      newData: { status: 'paid' },
      previousData: { status: 'pending' }
    });
  }
}
```

## AuditEntry

Estrutura de dados para uma entrada de auditoria:

- `action`: Tipo de ação (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `OTHER`).
- `resource`: Nome do recurso afetado (ex: `users`, `products`).
- `resourceId`: (Opcional) Identificador único do recurso.
- `userId`: (Opcional) ID do usuário que realizou a ação.
- `previousData`: (Opcional) Estado do recurso antes da alteração.
- `newData`: (Opcional) Estado do recurso após a alteração.
- `metadata`: (Opcional) Dados adicionais (IP, User Agent, etc.).
- `timestamp`: (Opcional) Data e hora do evento.

## Integração com Repositórios

Ao utilizar o `PrismaRepository` ou outros adaptadores oficiais, você pode passar o `AuditService` no construtor para habilitar a auditoria automática de CRUD.

```ts
export class OrdersRepository extends PrismaRepository<Order> {
  constructor(prisma: PrismaClient, audit: AuditService) {
    super(prisma.order, 'orders', { auditService: audit });
  }
}
```

## Estendendo a Auditoria

Você pode sobrescrever o `AuditService` para salvar os logs em uma tabela dedicada no banco de dados:

```ts
export class DatabaseAuditService extends AuditService {
  constructor(logger: Logger, private db: Database) {
    super(logger);
  }

  async log(entry: AuditEntry) {
    const log = await super.log(entry);
    await this.db.auditLogs.create({ data: log });
    return log;
  }
}
```
