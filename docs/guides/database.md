# Banco de Dados

O V12 incentiva um desenho simples: services falam com repositories, e repositories encapsulam ORM, filtros, paginação e detalhes de persistência.

## Estrutura recomendada

```txt
src/features/users/
  users.module.ts
  users.service.ts
  users.repository.ts
  users.schemas.ts
```

## Responsabilidades

### Service

- regra de negócio
- orquestração
- validações de domínio

### Repository

- queries
- mapeamento de persistência
- paginação
- filtros

### Adapter

- ciclo de vida do client/ORM
- transações

## Exemplo com Prisma

## 1. Repository

```ts
import { PrismaRepository } from '@eddiecbrl/v12';
import type { PrismaClient, User } from '@prisma/client';

export class UsersRepository extends PrismaRepository<User> {
  constructor(prisma: PrismaClient) {
    super(prisma.user, 'users');
  }

  async findByEmail(email: string) {
    return this.model.findUnique({ where: { email } });
  }
}
```

## 2. Service

```ts
export class UsersService {
  static inject = [UsersRepository] as const;

  constructor(private readonly repo: UsersRepository) {}

  async create(data: { name: string; email: string }) {
    return this.repo.create(data);
  }

  async listActive(page: number) {
    return this.repo.findPaginated({
      where: {
        active: true,
      },
      sort: {
        field: 'createdAt',
        order: 'desc',
      },
      page,
      limit: 20,
    });
  }
}
```

## 3. Registro no módulo

```ts
import { defineModule } from '@eddiecbrl/v12';

export const UsersModule = defineModule({
  name: 'users',
  providers: [
    {
      provide: UsersRepository,
      useFactory: (container) => {
        const prisma = container.resolve('PrismaClient');
        return new UsersRepository(prisma);
      },
    },
    UsersService,
  ],
});
```

## Filtros e paginação

```ts
const result = await usersRepository.findPaginated({
  where: {
    status: 'ACTIVE',
    createdAt: { $gte: new Date('2026-01-01') },
    email: { $like: '%@example.com' },
  },
  sort: { field: 'name', order: 'asc' },
  page: 2,
  limit: 10,
});
```

## Multi-tenancy

Se você passar `tenantId` para o repository base:

- inserts podem receber `tenantId` automaticamente
- queries passam a incluir filtro de tenant

Exemplo:

```ts
const repo = new UsersRepository(prisma.user as any, 'users', {
  tenantId: 'tenant-a',
});
```

## Auditoria

Se `auditService` estiver presente, o repository pode registrar automaticamente:

- `CREATE`
- `UPDATE`
- `DELETE`

Isso acontece nos hooks `afterCreate`, `afterUpdate` e `afterDelete`.

## Hooks úteis

Você pode customizar:

```ts
beforeCreate
afterCreate
beforeUpdate
afterUpdate
beforeDelete
afterDelete
```

Exemplo:

```ts
class UsersRepository extends PrismaRepository<any> {
  constructor(model: any) {
    super(model, 'users');
  }

  protected async beforeCreate(data: any) {
    return {
      ...data,
      email: String(data.email).toLowerCase(),
    };
  }
}
```

## E se eu usar TypeORM?

O V12 já tem:

- `TypeOrmAdapter`
- `TypeOrmRepository`

O repository base implementa CRUD e paginação sobre o repositório do TypeORM.

## E se eu usar Mongoose?

O V12 também oferece:

- `MongooseAdapter`
- `MongooseRepository`

O repository base já implementa CRUD com `lean()` e mapeamento de filtros comuns.

## E se eu usar Drizzle?

O `DrizzleAdapter` já existe, mas o `DrizzleRepository` atual é uma base abstrata estrutural. Você normalmente implementará os métodos conforme seu driver e dialeto.

## Boas práticas

- mantenha query complexa encapsulada no repository
- não injete ORM direto em controller
- faça o service depender da abstração de dados
- deixe transformação de persistência perto do repository
- use paginação desde cedo em listagens potencialmente grandes

## Links relacionados

- [Database API](/api/database)
- [Services](/concepts/services)
- [Multi-tenancy & Audit](/guides/multi-tenancy-audit)
