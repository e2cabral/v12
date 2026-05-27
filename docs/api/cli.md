# CLI

A CLI do V12 acelera o scaffold do projeto e ajuda a manter as convenções do framework consistentes ao longo do tempo.

Ela cobre dois cenários:

- iniciar a base do projeto
- gerar ou remover artefatos alinhados à arquitetura feature-driven

## Como executar

Se o pacote estiver instalado:

```bash
npx v12 --help
```

Dentro deste repositório:

```bash
npm run v12 -- --help
```

## Visão geral dos comandos

### `init`

Inicializa a estrutura básica do projeto **no diretório atual**.

```bash
npx v12 init
```

Fluxo comum:

```bash
mkdir my-api
cd my-api
npx v12 init
npm install
```

### `sdk`

Gera um SDK TypeScript com base nas rotas da sua aplicação.

```bash
npx v12 sdk --output ./src/shared/sdk.ts --url http://localhost:3000
```

Esse comando importa `src/app.ts`, espera encontrar um `buildApp()` exportado e usa a app montada para inspecionar rotas.

### `migrate`

Executa migrações detectando automaticamente Prisma, Drizzle ou TypeORM.

```bash
npx v12 migrate dev
npx v12 migrate deploy
npx v12 migrate create add-users-table
npx v12 migrate status
```

## Grupo `generate`

O comando `generate` cria artefatos e, quando possível, também atualiza o módulo da feature e o `src/app.ts`.

## `generate feature`

Cria uma feature completa.

```bash
npx v12 generate feature billing
```

Opções:

- `--template <standard|minimal>`
- `--no-register`

Exemplos:

```bash
npx v12 generate feature catalog --template minimal
npx v12 generate feature admin --no-register
```

O template `standard` gera uma base mais completa. O `minimal` é mais leve e útil para começar pequenos domínios.

## `generate resource`

Gera um CRUD completo com controller, service, repository, schemas, rotas e teste.

```bash
npx v12 generate resource users profile-card
```

Opções:

- `--path <path>`
- `--no-register`
- `--adapter <memory|prisma|drizzle|typeorm|mongoose|base>`

Exemplos:

```bash
npx v12 generate resource users profile-card --path /profiles
npx v12 generate resource billing invoice --adapter prisma
```

## `generate controller`

```bash
npx v12 generate controller users admin-panel
```

Opção:

- `--no-register`

## `generate service`

```bash
npx v12 generate service users sync-profile
```

Opção:

- `--no-register`

## `generate repository`

```bash
npx v12 generate repository billing invoice --adapter drizzle
```

Opções:

- `--no-register`
- `--adapter <memory|prisma|drizzle|typeorm|mongoose|base>`

## `generate schema`

Adiciona um schema exportado ao arquivo de schemas da feature.

```bash
npx v12 generate schema users admin-filter
```

## `generate route`

Adiciona uma rota a uma feature existente e pode também criar controller dedicado e schema nomeado.

```bash
npx v12 generate route users export-report --method POST --path /reports/export
```

Opções:

- `--method <GET|POST|PUT|PATCH|DELETE>`
- `--path <path>`
- `--controller <controller>`
- `--schema <schema>`

Exemplo mais completo:

```bash
npx v12 generate route users export-report \
  --method POST \
  --path /reports/export \
  --controller report-admin \
  --schema report-export
```

## `generate middleware`

```bash
npx v12 generate middleware auth require-session
```

## `generate guard`

```bash
npx v12 generate guard auth is-admin
```

## `generate mail`

```bash
npx v12 generate mail users welcome-email
```

## Grupo `remove`

Os comandos `remove` limpam arquivos gerados e tentam remover referências associadas.

## `remove feature`

```bash
npx v12 remove feature legacy-feature
```

## `remove resource`

```bash
npx v12 remove resource users profile-card --path /profiles
```

## `remove route`

```bash
npx v12 remove route users export-report --method POST --path /reports/export
```

Também aceita:

- `--controller <controller>`
- `--schema <schema>`

## O que a CLI atualiza automaticamente

Dependendo do comando, a CLI pode:

- registrar o módulo em `src/app.ts`
- registrar providers no arquivo `*.module.ts`
- adicionar imports
- criar arquivos de teste
- atualizar schemas da feature

## Exemplo de fluxo completo

```bash
npx v12 init
npx v12 generate feature users
npx v12 generate resource users profile-card --path /profiles
npx v12 generate route users export-report --method POST --path /reports/export
npx v12 sdk --output ./sdk.ts --url http://localhost:3000
```

## Cuidados práticos

- a CLI espera uma estrutura de projeto compatível com o padrão do framework
- vários comandos assumem a presença de `src/app.ts`
- para `sdk`, `src/app.ts` precisa exportar `buildApp()`
- revise o código gerado como ponto de partida, não como verdade intocável

## Links relacionados

- [Quick Start](/introduction/quick-start)
- [Começando](/getting-started)
- [Cookbook CRUD](/cookbook/crud)
- [SDK](/api/sdk)
