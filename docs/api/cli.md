# CLI



A CLI do V12 é uma ferramenta poderosa para automatizar o scaffolding do seu projeto, gerando códigos que seguem os padrões recomendados e registrando-os automaticamente nos módulos.

## Instalação

A CLI já vem inclusa no framework. Você pode executá-la via `npx`:

```bash
npx v12 --help
```

## Comandos Gerais

### init

Inicializa a estrutura básica de um novo projeto V12.

```bash
npx v12 init
```

### sdk

Gera um SDK TypeScript completo baseado nas rotas da sua aplicação.

```bash
npx v12 sdk --output ./src/shared/sdk.ts --url http://api.meuprojeto.com
```

### migrate

Executa migrações de banco de dados, detectando automaticamente se você usa Prisma, Drizzle ou TypeORM.

```bash
npx v12 migrate dev
npx v12 migrate deploy
```

## Scaffolding (generate)

O comando `generate` (ou `g`) cria arquivos de boilerplate para sua feature.

### feature

Cria uma nova pasta de feature com módulo e estrutura inicial.

```bash
npx v12 generate feature billing
```

### resource

Gera um CRUD completo (Controller, Service, Repository, Schema e Rotas) para um recurso.

```bash
npx v12 generate resource users user-profile --adapter prisma
```

### controller | service | repository

Gera componentes individuais e os registra no módulo da feature.

```bash
npx v12 generate service users auth-service
npx v12 generate repository billing invoice --adapter drizzle
```

### route | schema | middleware | guard | mail

Gera outros artefatos essenciais.

```bash
npx v12 generate route users login --method POST
npx v12 generate guard auth is-admin
npx v12 generate mail users welcome-email
```

## Remoção (remove)

Permite remover artefatos gerados e limpar as referências nos módulos.

```bash
npx v12 remove feature legacy-feature
npx v12 remove resource users old-resource
```

## Links relacionados

- [Quick Start](/introduction/quick-start)
- [Cookbook CRUD](/cookbook/crud)
