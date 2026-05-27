# createRouter

`createRouter()` constroi a API declarativa de rotas do `v12` e organiza handlers, middlewares e schemas por feature.

## Assinatura

```ts
createRouter(prefix?: string)
```

## Metodos

- `get`
- `post`
- `put`
- `patch`
- `delete`
- `build`

## Exemplo minimo

```ts
const router = createRouter();

router.get('/', {
  handler: ({ container }) => container.resolve(UsersController).list(),
});

export const usersRoutes = router.build();
```

## Exemplo com validacao e params

```ts
import { z } from 'zod';
import { createRouter } from 'v12';
import { UsersController } from './users.controller.js';

const getUserSchema = {
  params: z.object({
    id: z.string().min(1),
  }),
};

const createUserSchema = {
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
};

const router = createRouter();

router.get('/:id', {
  schema: getUserSchema,
  handler: (context) => context.container.resolve(UsersController).get(context),
});

router.post('/', {
  schema: createUserSchema,
  handler: (context) => context.container.resolve(UsersController).create(context),
});

export const usersRoutes = router.build();
```

## Prefixo local

Voce pode criar um prefixo dentro do router:

```ts
const router = createRouter('/admin');
```

Se o modulo tambem tiver prefixo, o runtime combina os dois valores.

## Middlewares por rota

```ts
router.delete('/:id', {
  middlewares: [
    async ({ request }) => {
      if (!request.headers.authorization) {
        throw new Error('Unauthorized');
      }
    },
  ],
  handler: (context) => context.container.resolve(UsersController).remove(context),
});
```

## Como a execucao funciona

1. o schema da rota valida `body`, `params`, `querystring` e `headers`
2. middlewares da rota executam antes do handler
3. o handler recebe `RequestContext`
4. o retorno do handler e serializado pelo helper de resposta do framework

## Cuidados

- evite duplicar paths no mesmo modulo
- mantenha o schema consistente com o formato que o handler espera
- prefira delegar regra de negocio para services em vez de escrever tudo na rota

## Links relacionados

- [Request Pipeline](/architecture/request-pipeline)
- [defineModule](/api/define-module)
- [Cookbook CRUD](/cookbook/crud)
