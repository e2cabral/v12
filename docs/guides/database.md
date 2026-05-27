# Banco de Dados

O V12 promove o desacoplamento entre a sua lógica de negócio e a persistência de dados através do padrão Repository e de adaptadores para os ORMs mais populares.

## Estrutura Recomendada

O fluxo de dados deve seguir esta hierarquia para garantir testabilidade e facilidade de manutenção:

1. **Service**: Contém a regra de negócio e depende de uma interface de repositório.
2. **Repository**: Implementa a interface e utiliza um adaptador específico.
3. **Adapter**: Envelopa o cliente do ORM (Prisma, Drizzle, etc.).

## Exemplo com Prisma

### 1. Definindo o Repositório

Estenda `PrismaRepository` para ganhar métodos de CRUD automáticos com paginação e filtros.

```ts
import { PrismaRepository } from 'v12';
import { PrismaClient, User } from '@prisma/client';

export class UsersRepository extends PrismaRepository<User> {
  constructor(prisma: PrismaClient) {
    // 'users' é o nome do recurso para auditoria
    super(prisma.user, 'users');
  }

  // Métodos customizados
  async findByEmail(email: string) {
    return this.model.findUnique({ where: { email } });
  }
}
```

### 2. Registrando no Módulo

Use o sistema de DI para injetar o cliente do banco no repositório.

```ts
export const UsersModule = defineModule({
  name: 'users',
  providers: [
    {
      provide: UsersRepository,
      useFactory: (container) => {
        const prisma = container.resolve('PrismaClient');
        return new UsersRepository(prisma);
      }
    },
    UsersService
  ],
  // ...
});
```

### 3. Utilizando no Serviço

O serviço não conhece o Prisma, apenas os métodos do repositório.

```ts
class UsersService {
  static inject = [UsersRepository] as const;
  constructor(private repo: UsersRepository) {}

  async create(data: any) {
    return this.repo.create(data);
  }

  async listActive(page: number) {
    return this.repo.findPaginated({
      where: { active: true },
      page,
      limit: 20
    });
  }
}
```

## Paginação e Filtros

O V12 lida com a complexidade de converter filtros da API para o formato do banco.

```ts
// Na rota/controller
const result = await repository.findPaginated({
  where: {
    status: 'ACTIVE',
    createdAt: { $gte: new Date('2026-01-01') }
  },
  sort: { field: 'name', order: 'asc' },
  page: request.query.page
});
```

## Multi-tenancy

Se sua aplicação é multi-tenant, o V12 pode isolar os dados automaticamente. Basta passar o `tenantId` no construtor do repositório ou via `setTenantId`.

```ts
const userRepo = new UsersRepository(prisma, { tenantId: 'empresa-a' });
await userRepo.findAll(); // Retorna apenas usuários da 'empresa-a'
```

## Links relacionados

- [Database API Reference](/api/database)
- [Padrão Repository](/concepts/services)
