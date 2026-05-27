# CRUD Completo com V12

Este guia prático mostra como implementar um CRUD (Create, Read, Update, Delete) completo utilizando as melhores práticas do V12, incluindo validação, service e repositório.

## 1. Definindo o Schema (Zod)

Começamos definindo como os dados devem entrar no sistema.

```ts
import { z } from 'zod';

export const CreateUserSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

export const UpdateUserSchema = CreateUserSchema.partial();
```

## 2. O Repositório

O repositório encapsula o acesso ao banco de dados (neste exemplo, usando Prisma).

```ts
import { Injectable, Database } from 'v12';

export class UsersRepository {
  constructor(private db: Database) {}

  async create(data: any) {
    return this.db.user.create({ data });
  }

  async findAll() {
    return this.db.user.findMany();
  }

  async findById(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    return this.db.user.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.db.user.delete({ where: { id } });
  }
}
```

## 3. O Service

O service aplica as regras de negócio.

```ts
import { BusinessError } from 'v12';
import { UsersRepository } from './users.repository.js';

export class UsersService {
  constructor(private repository: UsersRepository) {}

  async create(data: any) {
    const exists = await this.repository.findByEmail(data.email);
    if (exists) throw new BusinessError('Email já cadastrado');
    
    return this.repository.create(data);
  }

  // ... outros métodos chamando o repositório
}
```

## 4. O Roteador (Router)

Aqui conectamos tudo: rota -> validação -> handler.

```ts
import { createRouter } from 'v12';
import { UsersService } from './users.service.js';
import { CreateUserSchema, UpdateUserSchema } from './users.schema.js';

const router = createRouter();

router.post('/', {
  schema: { body: CreateUserSchema },
  handler: async ({ request, container }) => {
    const service = container.resolve(UsersService);
    return service.create(request.body);
  }
});

router.get('/', {
  handler: async ({ container }) => {
    const service = container.resolve(UsersService);
    return service.findAll();
  }
});

router.get('/:id', {
  handler: async ({ request, container }) => {
    const service = container.resolve(UsersService);
    return service.findById(request.params.id);
  }
});

router.patch('/:id', {
  schema: { body: UpdateUserSchema },
  handler: async ({ request, container }) => {
    const service = container.resolve(UsersService);
    return service.update(request.params.id, request.body);
  }
});

router.delete('/:id', {
  handler: async ({ request, container }) => {
    const service = container.resolve(UsersService);
    await service.delete(request.params.id);
    return { success: true };
  }
});

export default router;
```

## 5. Registrando o Módulo

Finalmente, declaramos o módulo para o V12.

```ts
import { defineModule } from 'v12';
import router from './users.router.js';
import { UsersService } from './users.service.js';
import { UsersRepository } from './users.repository.js';

export const UsersModule = defineModule({
  name: 'users',
  providers: [UsersService, UsersRepository],
  routes: router.build()
});
```

## Por que fazer assim?

1.  **Validação Automática**: O framework garante que o `request.body` no handler já é válido.
2.  **Injeção de Dependência**: O Service e o Repositório são instanciados e injetados automaticamente.
3.  **Tratamento de Erros**: Se o `UsersService` lançar um `BusinessError`, o V12 retorna o status code correto (400) automaticamente.
4.  **Testabilidade**: Cada peça (Schema, Service, Repositório) pode ser testada isoladamente com facilidade.
