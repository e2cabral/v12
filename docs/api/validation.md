# Validation API

O V12 usa Zod para validação de entrada nas rotas e expõe um helper reutilizável para validação manual.

## Onde a validação entra

As rotas podem declarar `schema` com:

- `body`
- `params`
- `querystring`
- `headers`
- `response`

## Exemplo de rota

```ts
import { z } from 'zod';

router.post('/users/:id', {
  schema: {
    body: z.object({
      name: z.string().min(3),
      email: z.string().email(),
    }),
    querystring: z.object({
      sendEmail: z.coerce.boolean().optional(),
    }),
    params: z.object({
      id: z.string().min(1),
    }),
    headers: z.object({
      'x-api-key': z.string(),
    }),
  },
  handler: async ({ request }) => {
    return {
      body: request.body,
      params: request.params,
      query: request.query,
    };
  },
});
```

## O que acontece no runtime

Na execução atual do router:

1. valida `body`
2. valida `params`
3. valida `querystring`
4. valida `headers`
5. executa middlewares da rota
6. executa handler

O helper usado internamente é `validateSchema()`.

## `validateSchema(schema, value)`

Valida um valor com Zod e converte erro para `ValidationError`.

```ts
import { validateSchema } from '@eddiecbrl/v12';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

const data = validateSchema(userSchema, {
  name: 'Ada',
  email: 'ada@example.com',
});
```

## Erro retornado

Quando a validação falha, o framework responde com `400` e um erro com:

- `code: 'VALIDATION_ERROR'`
- `message: 'Validation failed'`
- `details` com `error.flatten()`

Formato típico:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fieldErrors": {
        "email": ["Invalid email"]
      }
    }
  }
}
```

## Tipagem prática

Uma abordagem boa é inferir tipos a partir do Zod:

```ts
const createUserSchema = {
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
};

type CreateUserInput = z.infer<typeof createUserSchema.body>;
```

Depois:

```ts
class UsersController {
  create = async ({ request }: { request: { body: CreateUserInput } }) => {
    return request.body;
  };
}
```

## Sobre `response`

O tipo `RouteSchema` inclui `response`, mas a execução atual do router valida apenas:

- `body`
- `params`
- `querystring`
- `headers`

Então `response` hoje funciona mais como metadado compartilhável do que como validação ativa no runtime.

## Boas práticas

- mantenha schemas perto da feature
- use `z.coerce.*` em query params e headers quando necessário
- reutilize schemas entre rota, testes e documentação
- derive tipos com `z.infer`
- use `.partial()` para updates

## Links relacionados

- [createRouter](/api/create-router)
- [Swagger/OpenAPI](/api/swagger)
- [Errors](/api/errors)
