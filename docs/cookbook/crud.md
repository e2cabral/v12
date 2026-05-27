# CRUD Completo com V12

Este cookbook mostra um CRUD simples e consistente com o jeito atual de usar o framework: schema, service, repository, router e módulo.

## Estrutura sugerida

```txt
src/features/users/
  users.module.ts
  users.routes.ts
  users.controller.ts
  users.service.ts
  users.schemas.ts
  users.repository.ts
```

## 1. Schemas

`users.schemas.ts`

```ts
import { z } from 'zod';

export const createUserSchema = {
  body: z.object({
    name: z.string().min(3),
    email: z.string().email(),
  }),
};

export const updateUserSchema = {
  body: createUserSchema.body.partial(),
};

export const userIdSchema = {
  params: z.object({
    id: z.string().min(1),
  }),
};
```

## 2. Repository

Aqui vai um exemplo simples em memória para deixar o fluxo claro:

```ts
import crypto from 'node:crypto';

export class UsersRepository {
  private readonly users: Array<{ id: string; name: string; email: string }> = [];

  findAll() {
    return this.users;
  }

  findById(id: string) {
    return this.users.find((user) => user.id === id) ?? null;
  }

  findByEmail(email: string) {
    return this.users.find((user) => user.email === email) ?? null;
  }

  create(data: { name: string; email: string }) {
    const user = {
      id: crypto.randomUUID(),
      ...data,
    };
    this.users.push(user);
    return user;
  }

  update(id: string, data: Partial<{ name: string; email: string }>) {
    const user = this.findById(id);
    if (!user) return null;
    Object.assign(user, data);
    return user;
  }

  delete(id: string) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }
}
```

## 3. Service

```ts
import { AppError } from '@eddiecbrl/v12';

export class UsersService {
  static inject = [UsersRepository] as const;

  constructor(private readonly repository: UsersRepository) {}

  list() {
    return this.repository.findAll();
  }

  get(id: string) {
    const user = this.repository.findById(id);
    if (!user) {
      throw new AppError('User not found', {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    }
    return user;
  }

  create(data: { name: string; email: string }) {
    const exists = this.repository.findByEmail(data.email);
    if (exists) {
      throw new AppError('Email already registered', {
        statusCode: 409,
        code: 'EMAIL_CONFLICT',
      });
    }

    return this.repository.create(data);
  }

  update(id: string, data: Partial<{ name: string; email: string }>) {
    const user = this.repository.update(id, data);
    if (!user) {
      throw new AppError('User not found', {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    }
    return user;
  }

  remove(id: string) {
    const deleted = this.repository.delete(id);
    if (!deleted) {
      throw new AppError('User not found', {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    }
    return { deleted: true };
  }
}
```

## 4. Controller

```ts
export class UsersController {
  static inject = [UsersService] as const;

  constructor(private readonly service: UsersService) {}

  list = async () => this.service.list();

  get = async ({ request }: any) =>
    this.service.get((request.params as any).id);

  create = async ({ request }: any) =>
    this.service.create(request.body as { name: string; email: string });

  update = async ({ request }: any) =>
    this.service.update(
      (request.params as any).id,
      request.body as Partial<{ name: string; email: string }>,
    );

  remove = async ({ request }: any) =>
    this.service.remove((request.params as any).id);
}
```

## 5. Router

```ts
import { createRouter } from '@eddiecbrl/v12';
import { UsersController } from './users.controller.js';
import { createUserSchema, updateUserSchema, userIdSchema } from './users.schemas.js';

const router = createRouter();

router.get('/', {
  handler: ({ container }) => container.resolve(UsersController).list(),
});

router.get('/:id', {
  schema: userIdSchema,
  handler: ({ container, request }) =>
    container.resolve(UsersController).get({ request }),
});

router.post('/', {
  schema: createUserSchema,
  handler: ({ container, request }) =>
    container.resolve(UsersController).create({ request }),
});

router.patch('/:id', {
  schema: {
    ...userIdSchema,
    ...updateUserSchema,
  },
  handler: ({ container, request }) =>
    container.resolve(UsersController).update({ request }),
});

router.delete('/:id', {
  schema: userIdSchema,
  handler: ({ container, request }) =>
    container.resolve(UsersController).remove({ request }),
});

export const usersRoutes = router.build();
```

## 6. Module

```ts
import { defineModule } from '@eddiecbrl/v12';

export const UsersModule = defineModule({
  name: 'users',
  providers: [UsersRepository, UsersService, UsersController],
  routes: usersRoutes,
});
```

## O que esse arranjo dá para você

- validação automática na borda HTTP
- service com regra de negócio clara
- repository isolado para persistência
- controller fino
- módulo pronto para evoluir

## Evoluindo para banco real

Quando quiser sair de memória:

- troque o repository por `PrismaRepository`, `TypeOrmRepository` ou `MongooseRepository`
- mantenha service, controller e rotas quase iguais

## Links relacionados

- [Começando](/getting-started)
- [Database API](/api/database)
- [Validation API](/api/validation)
