# CLI

Resumo curto

A CLI do `v12` acelera bootstrap, expansão e limpeza de artefatos.

## Comandos principais

- `generate feature`
- `generate controller`
- `generate service`
- `generate repository`
- `generate schema`
- `generate route`
- `generate resource`
- `remove route`
- `remove resource`

## Exemplos

```bash
v12 generate feature users
v12 generate resource users profile-card --path /profiles
v12 remove route users export-report --method POST --path /reports/export
```

## Performance

A CLI prioriza produtividade. Hoje a edição é baseada principalmente em texto e regex.

## Migração

No futuro, a CLI deve evoluir para edição estrutural.

## Links relacionados

- [Quick Start](/introduction/quick-start)
- [Cookbook CRUD](/cookbook/crud)
