# Errors



O V12 define uma hierarquia de exceções padronizada. Quando uma dessas exceções é lançada dentro de um handler ou middleware, o framework a captura automaticamente e retorna uma resposta JSON formatada com o status code e o código de erro correspondentes.

## AppError

Classe base para todos os erros da aplicação.

- `message`: Descrição do erro para humanos.
- `statusCode`: Status HTTP (ex: 400, 404, 500).
- `code`: Identificador estável do erro (ex: `INTERNAL_SERVER_ERROR`).
- `details`: Objeto opcional com dados extras sobre o erro.

## Classes Especializadas

O V12 exporta classes para os cenários mais comuns:

- `ValidationError(message, details)`: Retorna 400 (Bad Request).
- `UnauthorizedError(message)`: Retorna 401 (Unauthorized).
- `ForbiddenError(message)`: Retorna 403 (Forbidden).
- `NotFoundError(message, code)`: Retorna 404 (Not Found).
- `ConflictError(message, code)`: Retorna 409 (Conflict).

## Formato da Resposta

Todas as exceções capturadas pelo V12 seguem este formato de resposta:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Usuário não encontrado",
    "details": null
  }
}
```

## Exemplo de Uso

```ts
import { NotFoundError } from 'v12';

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

## Tratamento de Erros Desconhecidos

Erros que não herdam de `AppError` são capturados, logados como erro crítico e retornam um status 500 genérico para evitar vazamento de informações sensíveis.
