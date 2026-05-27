# Database API

O V12 abstrai o acesso ao banco de dados através de adaptadores e do padrão Repository, fornecendo funcionalidades prontas como paginação, filtros avançados, auditoria e multi-tenancy.

## Adaptadores

Os adaptadores permitem que o V12 se comunique com diferentes ORMs.

- `PrismaAdapter`: Suporte para Prisma ORM.
- `DrizzleAdapter`: Suporte para Drizzle ORM.
- `TypeORMAdapter`: Suporte para TypeORM.
- `MongooseAdapter`: Suporte para Mongoose (MongoDB).

```ts
import { PrismaClient } from '@prisma/client';
import { PrismaAdapter } from 'v12';

const prisma = new PrismaClient();
const db = new PrismaAdapter(prisma);
```

## Repositories

O V12 fornece classes base para criar repositórios com facilidade.

### BaseRepository / Repository

A classe abstrata `Repository` define os métodos padrão de CRUD:

- `findAll()`: Retorna todos os registros.
- `find(options)`: Busca registros com filtros, ordenação e paginação.
- `findPaginated(options)`: Busca registros retornando metadados de paginação.
- `findById(id)`: Busca um registro pelo ID.
- `create(data)`: Cria um novo registro.
- `update(id, data)`: Atualiza um registro existente.
- `delete(id)`: Remove um registro.

### PrismaRepository

Implementação base para repositórios usando Prisma.

```ts
import { PrismaRepository } from 'v12';

export class UsersRepository extends PrismaRepository<User> {
  constructor(prisma: PrismaClient) {
    super(prisma.user, 'users');
  }
}
```

## Query Options

Os métodos `find` e `findPaginated` aceitam um objeto `QueryOptions`:

- `where`: Filtros (`Filters`).
- `sort`: Ordenação (`SortOptions`).
- `page`: Número da página (padrão: 1).
- `limit`: Itens por página (padrão: 10).

### Filtros Avançados

O V12 suporta operadores nos filtros:

- `$eq`: Igual a
- `$ne`: Diferente de
- `$gt`: Maior que
- `$gte`: Maior ou igual a
- `$lt`: Menor que
- `$lte`: Menor ou igual a
- `$in`: Presente na lista
- `$like`: Busca parcial (ex: `%termo%`)

Exemplo de query:
```ts
const users = await repository.find({
  where: {
    age: { $gte: 18 },
    name: { $like: 'João%' }
  },
  sort: { field: 'createdAt', order: 'desc' },
  page: 1,
  limit: 20
});
```

## Recursos Embutidos

### Multi-tenancy

Ao estender `Repository`, você pode passar um `tenantId` nas opções. O framework aplicará automaticamente o filtro de `tenantId` em todas as consultas e inserções.

### Auditoria

Se um `AuditService` for fornecido ao repositório, ele registrará automaticamente ações de `CREATE`, `UPDATE` e `DELETE`.

### Hooks (Lifecycle)

Você pode sobrescrever métodos de ciclo de vida no seu repositório:
- `beforeCreate`, `afterCreate`
- `beforeUpdate`, `afterUpdate`
- `beforeDelete`, `afterDelete`

## Links relacionados

- [Guia de Banco de Dados](/guides/database)
- [createApp](/api/create-app)
