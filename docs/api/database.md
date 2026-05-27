# Database API

O V12 organiza persistência em torno de dois blocos:

- adapters, que encapsulam o cliente do ORM
- repositories, que expõem operações de domínio e utilidades comuns

## O que existe hoje

Adapters:

- `PrismaAdapter`
- `DrizzleAdapter`
- `TypeOrmAdapter`
- `MongooseAdapter`

Bases de repositório:

- `Repository`
- `PrismaRepository`
- `DrizzleRepository`
- `TypeOrmRepository`
- `MongooseRepository`

## `DatabaseAdapter`

O contrato base é:

```ts
interface DatabaseAdapter {
  name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  transaction?<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}
```

## `Repository`

A classe base `Repository<T, CreateDTO, UpdateDTO>` oferece:

- `getPagination()`
- `createPaginatedResult()`
- hooks `before*` e `after*`
- suporte a `tenantId`
- suporte a `auditService`

### Interface principal

```ts
findAll(): Promise<T[]>
find(options?: QueryOptions): Promise<T[]>
findPaginated(options?: QueryOptions): Promise<PaginatedResult<T>>
findById(id: string): Promise<T | null>
create(data: CreateDTO): Promise<T>
update(id: string, data: UpdateDTO): Promise<T>
delete(id: string): Promise<boolean>
```

## Query options

Os métodos `find()` e `findPaginated()` usam:

```ts
type QueryOptions = {
  where?: Filters;
  sort?: SortOptions | SortOptions[];
  page?: number;
  limit?: number;
}
```

### Filtros suportados

- `$eq`
- `$ne`
- `$gt`
- `$gte`
- `$lt`
- `$lte`
- `$like`
- `$in`

### Exemplo

```ts
const users = await repository.find({
  where: {
    age: { $gte: 18 },
    name: { $like: 'Ada%' },
  },
  sort: { field: 'createdAt', order: 'desc' },
  page: 1,
  limit: 20,
});
```

## `PrismaAdapter`

Encapsula um client compatível com Prisma.

```ts
import { PrismaAdapter } from '@eddiecbrl/v12';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const adapter = new PrismaAdapter(prisma);

await adapter.connect();
await adapter.disconnect();
```

## `PrismaRepository`

É a implementação mais completa pronta no código atual.

```ts
import { PrismaRepository } from '@eddiecbrl/v12';
import { PrismaClient, User } from '@prisma/client';

export class UsersRepository extends PrismaRepository<User> {
  constructor(prisma: PrismaClient) {
    super(prisma.user, 'users');
  }

  async findByEmail(email: string) {
    return this.model.findUnique({ where: { email } });
  }
}
```

### O que ele entrega

- CRUD básico
- paginação
- mapeamento de filtros
- mapeamento de sort
- hooks de ciclo de vida
- suporte a `tenantId`
- integração com auditoria via `afterCreate`, `afterUpdate`, `afterDelete`

## Exemplo com module provider

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

## `TypeOrmAdapter` e `TypeOrmRepository`

O adapter encapsula o `DataSource` e o repository base implementa CRUD com:

- `repository.find`
- `findAndCount`
- `create/save`
- `update`
- `delete`

Também converte filtros para operadores TypeORM quando disponíveis.

## Exemplo curto

```ts
import { TypeOrmRepository } from '@eddiecbrl/v12';

export class UsersRepository extends TypeOrmRepository<any> {
  constructor(repository: any) {
    super(repository, 'users');
  }
}
```

## `MongooseAdapter` e `MongooseRepository`

O adapter gerencia sessão/transação e o repository base implementa CRUD usando `lean()`.

### Comportamento útil

- `findAll`, `find` e `findPaginated` usam `lean`
- `findById` busca por `_id`
- `$like` vira `RegExp`
- `sort` mapeia para `1` e `-1`

## `DrizzleAdapter` e `DrizzleRepository`

O adapter existe e suporta `transaction()`, mas o `DrizzleRepository` é abstrato e espera que você implemente as operações segundo o dialeto/driver usado.

Em outras palavras: ele serve mais como base estrutural do que como repository pronto.

## Paginação

O helper base calcula:

```ts
page
limit
skip
```

e `findPaginated()` retorna:

```ts
{
  data: T[],
  meta: {
    total: number,
    page: number,
    lastPage: number,
    limit: number,
  }
}
```

## Hooks de ciclo de vida

Você pode sobrescrever:

- `beforeCreate`
- `afterCreate`
- `beforeUpdate`
- `afterUpdate`
- `beforeDelete`
- `afterDelete`

## Exemplo

```ts
class UsersRepository extends PrismaRepository<any> {
  constructor(model: any) {
    super(model, 'users');
  }

  protected async beforeCreate(data: any) {
    return {
      ...data,
      normalizedEmail: String(data.email).toLowerCase(),
    };
  }
}
```

## Multi-tenancy

Se `tenantId` for passado ao repository base, o framework:

- injeta `tenantId` automaticamente em `beforeCreate`
- aplica filtro de tenant nas consultas via `applyTenantFilter()`

Exemplo:

```ts
const repo = new UsersRepository(prisma.user, 'users', {
  tenantId: 'tenant-a',
});
```

## Auditoria

Se `auditService` for passado, os hooks `afterCreate`, `afterUpdate` e `afterDelete` registram eventos de auditoria automaticamente.

## Boas práticas

- deixe o service depender do repository, não do ORM direto
- use repositories para encapsular queries específicas do domínio
- use hooks para transformação leve e auditoria, não para regra de negócio inteira
- mantenha `tenantId` e `auditService` perto da borda de composição

## Links relacionados

- [Guia de Banco de Dados](/guides/database)
- [Services](/concepts/services)
- [createApp](/api/create-app)
