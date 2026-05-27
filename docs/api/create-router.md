# createRouter

`createRouter()` constroi a API declarativa de rotas do `v12` e organiza handlers, middlewares e schemas por feature.

## Assinatura

```ts
createRouter(prefix?: string)
```

## Metodos

- `get(path, definition)`: Define uma rota GET
- `post(path, definition)`: Define uma rota POST
- `put(path, definition)`: Define uma rota PUT
- `patch(path, definition)`: Define uma rota PATCH
- `delete(path, definition)`: Define uma rota DELETE
- `build()`: Gera a `RouterDefinition` final para ser usada no `defineModule()`

## Definição de Rota

Cada método de rota aceita um objeto de definição com:

- `handler`: Função que processa a requisição (`(context: RequestContext) => any`)
- `schema`: Objeto com validadores Zod para `body`, `params`, `querystring` e `headers`
- `middlewares`: Lista de `RouteMiddleware` específicos para esta rota
- `version`: Versão opcional da rota (ex: `'v1'`)
- `websocket`: Boolean indicando se a rota é um endpoint WebSocket

## RequestContext

O `handler` e os `middlewares` recebem um `RequestContext` contendo:

- `request`: Instância do FastifyRequest (tipada conforme o schema)
- `reply`: Instância do FastifyReply
- `container`: Container de DI com escopo de requisição (child container)
- `t(key, args)`: Helper de tradução (i18n)
- `connection`: Disponível apenas em rotas `websocket`

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
