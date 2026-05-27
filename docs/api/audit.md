# Audit API

O `AuditService` registra ações importantes para rastreabilidade, conformidade e diagnóstico.

## O serviço

O contrato atual é simples:

```ts
class AuditService {
  async log(entry: AuditEntry)
}
```

## `AuditEntry`

```ts
type AuditEntry = {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'OTHER';
  resource: string;
  resourceId?: string;
  userId?: string;
  previousData?: any;
  newData?: any;
  metadata?: any;
  timestamp?: Date;
}
```

## Exemplo de uso

No container criado por `createApp()`, o serviço é registrado por padrão com o token:

```txt
'AuditService'
```

Exemplo em provider com DI por token:

```ts
class OrdersService {
  static inject = ['AuditService'] as const;

  constructor(private readonly audit: any) {}

  async markAsPaid(orderId: string, userId: string) {
    await this.audit.log({
      action: 'UPDATE',
      resource: 'orders',
      resourceId: orderId,
      userId,
      newData: { status: 'paid' },
      metadata: { source: 'manual' },
    });
  }
}
```

## O que acontece internamente

A implementação atual:

- garante `timestamp` quando ele não é enviado
- envia o log para o logger estruturado da aplicação
- retorna o objeto final de auditoria

## Exemplo de retorno

```ts
const log = await audit.log({
  action: 'LOGIN',
  resource: 'auth',
  userId: 'user-1',
});
```

Retorno típico:

```ts
{
  action: 'LOGIN',
  resource: 'auth',
  userId: 'user-1',
  timestamp: new Date(),
}
```

## Integração com repositories

Os repositories base podem receber `auditService` nas opções:

```ts
super(prisma.user, 'users', { auditService })
```

Quando isso acontece, os hooks base registram automaticamente:

- `CREATE`
- `UPDATE`
- `DELETE`

## Exemplo com PrismaRepository

```ts
import { PrismaRepository } from '@eddiecbrl/v12';

export class OrdersRepository extends PrismaRepository<any> {
  constructor(model: any, auditService: any) {
    super(model, 'orders', { auditService });
  }
}
```

## Estendendo o serviço

Se quiser persistir auditoria em banco, você pode compor ou estender o serviço:

```ts
import { AuditService } from '@eddiecbrl/v12';

export class DatabaseAuditService extends AuditService {
  constructor(logger: any, private readonly db: any) {
    super(logger);
  }

  async log(entry: any) {
    const log = await super.log(entry);
    await this.db.auditLogs.create({ data: log });
    return log;
  }
}
```

## Boas práticas

- audite mudanças relevantes de estado
- inclua `resource`, `resourceId` e `userId` sempre que possível
- use `metadata` para contexto operacional, não para inflar o log inteiro
- prefira auditoria automática no repository para CRUD e manual no service para ações de negócio

## Links relacionados

- [Database API](/api/database)
- [Guia de Multi-tenancy & Audit](/guides/multi-tenancy-audit)
