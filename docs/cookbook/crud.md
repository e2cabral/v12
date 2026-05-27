# CRUD

Problema

Preciso criar um CRUD consistente sem montar tudo manualmente.

Solução

Use `generate resource`.

Implementação

```bash
v12 generate resource users profile-card --path /profiles
```

Explicação

O comando cria controller, service, repository, schemas, rotas e teste do recurso.
