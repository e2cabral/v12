# Security



O `v12` já fornece base de autenticação e autorização, mas segurança operacional precisa ser tratada como disciplina contínua.

## Cobertura

- auth
- authorization
- secrets
- CORS
- headers
- rate limit
- threat modeling

## Modelo recomendado

```txt
input validation
  -> auth
  -> authorization
  -> observability
  -> safe persistence
```
