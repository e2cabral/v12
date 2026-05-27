# Instalação

Esta página cobre os requisitos do V12, as formas de instalar o pacote e o que validar antes de começar um projeto novo ou preparar CI.

## Requisitos

- Node.js `20` ou superior
- npm, pnpm, yarn ou bun
- familiaridade básica com TypeScript e APIs HTTP

> O `package.json` do projeto declara `node >= 20`.

## Instalando o framework em um projeto

Se você quer usar o V12 como dependência de uma aplicação:

```bash
npm install @eddiecbrl/v12 zod
```

Com outras ferramentas:

```bash
pnpm add @eddiecbrl/v12 zod
yarn add @eddiecbrl/v12 zod
bun add @eddiecbrl/v12 zod
```

O `zod` entra quase sempre junto porque o framework usa schemas Zod para validação e geração de documentação.

## Instalando dependências para desenvolver o próprio repositório

Se você está trabalhando neste código-fonte do framework:

```bash
npm install
```

Scripts úteis:

```bash
npm run dev
npm run test
npm run typecheck
npm run docs:dev
```

## Verificando o ambiente

Antes de seguir, vale confirmar:

```bash
node -v
npm -v
```

Se `node -v` retornar algo abaixo de `20`, a CLI e os exemplos podem se comportar de forma inconsistente.

## Estrutura mínima esperada numa aplicação

Você não precisa começar com uma estrutura enorme. O menor setup útil costuma ter:

```txt
src/
  app.ts
  server.ts
```

Conforme as features entram:

```txt
src/
  app.ts
  server.ts
  features/
    users/
      users.module.ts
      users.routes.ts
      users.controller.ts
      users.service.ts
      users.schemas.ts
```

## Exemplo mínimo de bootstrap

`src/app.ts`

```ts
import { createApp } from '@eddiecbrl/v12';

export const buildApp = () =>
  createApp({
    modules: [],
  });
```

`src/server.ts`

```ts
import { buildApp } from './app.js';

const app = await buildApp();

await app.listen({
  port: 3000,
  host: '0.0.0.0',
});
```

## Instalação da CLI

O framework expõe um binário `v12` quando instalado. Você pode usar:

```bash
npx v12 --help
```

Dentro deste repositório, também existe o script:

```bash
npm run v12 -- --help
```

Alguns comandos úteis:

```bash
npx v12 init
npx v12 generate feature users
npx v12 generate resource users profile-card --adapter memory
npx v12 sdk --output ./sdk.ts --url http://localhost:3000
```

## O que o comando `init` faz

O comando:

```bash
npx v12 init
```

inicializa a estrutura básica **no diretório atual**. Ele não recebe o nome do projeto como argumento no estado atual da CLI.

Um fluxo comum seria:

```bash
mkdir my-api
cd my-api
npx v12 init
npm install
```

## Boas práticas de setup

- padronize a versão de Node no time
- execute `typecheck` e `test` no CI
- mantenha `src/app.ts` como ponto de montagem da aplicação
- use `src/server.ts` só para bootstrap e `listen`

## Problemas comuns

### `npm run dev` não sobe

Possíveis causas:

- Node abaixo da versão suportada
- dependências não instaladas
- erro de import ESM/arquivo `.js` nos imports relativos compilados

Checklist rápido:

```bash
node -v
npm install
npm run typecheck
```

### A CLI não é encontrada

Tente:

```bash
npx v12 --help
```

ou, dentro do repositório:

```bash
npm run v12 -- --help
```

## Próximos passos

- [Quick Start](/introduction/quick-start)
- [Começando](/getting-started)
- [Configuração](/concepts/configuration)
- [CLI](/api/cli)
