# Errors

Resumo curto

O `v12` define uma hierarquia de erros padronizada para APIs.

## Classes

- `AppError`
- `ValidationError`
- `UnauthorizedError`
- `ForbiddenError`
- `NotFoundError`
- `ConflictError`

## Exemplo

```ts
throw new NotFoundError('User not found', 'USER_NOT_FOUND');
```

## Compatibilidade

A resposta HTTP padronizada é estável e serve como contrato para clientes.

## Links relacionados

- [Security](/security/)
- [Troubleshooting em guides](/guides/testing)
