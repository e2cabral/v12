# Errors

O V12 define uma hierarquia simples de erros de aplicação. Quando um desses erros é lançado em handler ou middleware, o framework converte isso em resposta HTTP padronizada.

## `AppError`

Classe base.

Campos:

- `message`
- `statusCode`
- `code`
- `details`

## Especializações disponíveis

- `ValidationError`
- `UnauthorizedError`
- `ForbiddenError`
- `NotFoundError`
- `ConflictError`

## Exemplo

```ts
import { NotFoundError } from '@eddiecbrl/v12';

class UsersService {
  async findById(id: string) {
    const user = await db.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
    }

    return user;
  }
}
```

## Formato da resposta

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Usuário não encontrado",
    "details": null
  }
}
```

## Erros desconhecidos

Se o erro não herdar de `AppError`, o framework:

- registra no logger
- responde com erro interno genérico

Isso evita vazamento acidental de detalhes sensíveis.

## Links relacionados

- [Validation](/api/validation)
- [createApp](/api/create-app)
