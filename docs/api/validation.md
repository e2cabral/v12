# Validation API

O V12 utiliza o [Zod](https://zod.dev/) como motor de validação padrão, permitindo definir schemas robustos para entradas e saídas de dados com tipagem estática garantida.

## Route Schema

Ao definir uma rota, você pode passar um objeto `schema` que contém as regras para diferentes partes da requisição.

```ts
import { z } from 'zod';

router.post('/users', {
  schema: {
    body: z.object({
      name: z.string().min(3),
      email: z.string().email(),
    }),
    querystring: z.object({
      sendEmail: z.boolean().optional(),
    }),
    params: z.object({
      id: z.string().uuid(),
    }),
    headers: z.object({
      'x-api-key': z.string(),
    }),
  },
  handler: async ({ request }) => {
    // request.body, request.query, etc. já estão validados e tipados aqui
  }
});
```

## Propriedades do Schema

-   **body**: Valida o corpo da requisição (JSON).
-   **querystring**: Valida os parâmetros de busca na URL (`?key=value`).
-   **params**: Valida os parâmetros de rota (`/users/:id`).
-   **headers**: Valida os cabeçalhos HTTP.
-   **response**: (Opcional) Valida e filtra o formato da resposta enviada ao cliente.

## Tratamento de Erros

Se a validação falhar, o V12 interrompe a execução automaticamente e retorna um erro `400 Bad Request` com um corpo estruturado contendo os detalhes do erro (campos inválidos e mensagens).

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

## Validação Manual

Você também pode utilizar o utilitário `validateSchema` ou o próprio Zod diretamente em seus services se precisar de validação em outros pontos da aplicação.

```ts
import { validateSchema } from 'v12';

const data = validateSchema(MyZodSchema, rawInput);
```

## Boas Práticas

-   **Reutilize Schemas**: Defina seus schemas em arquivos separados (`.schema.ts`) para que possam ser usados tanto no roteador quanto em testes ou no frontend (se estiver usando TypeScript no front).
-   **Partial Schemas**: Use `.partial()` do Zod para criar schemas de atualização (PATCH) baseados em schemas de criação (POST).
-   **Coerção**: Use `z.coerce.number()` ou `z.coerce.boolean()` para parâmetros que vêm como string mas devem ser tratados como outros tipos (comum em query params).

## Links relacionados

- [Zod Documentation](https://zod.dev/)
- [Errors API](/api/errors)
- [createRouter API](/api/create-router)
