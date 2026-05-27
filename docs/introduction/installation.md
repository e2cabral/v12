# Instalação

Resumo curto

Esta página explica como instalar, validar requisitos e subir a base do `v12`.

## Quando usar

Use esta página antes de criar a primeira aplicação ou ao preparar ambiente de CI.

## Conceito

O `v12` é `TypeScript-first`, usa `Node.js 20+` e assume uma base moderna de tooling.

## Exemplo rápido

```bash
npm install
npm run dev
```

## Explicação completa

### Requisitos

- Node.js `20+`
- npm, pnpm, yarn ou bun

### npm

```bash
npm install
npm run dev
```

### pnpm

```bash
pnpm install
pnpm run dev
```

### yarn

```bash
yarn
yarn dev
```

### bun

```bash
bun install
bun run dev
```

## Exemplos avançados

- rodar `npm run docs:dev`
- rodar `npm run typecheck`
- rodar `npm test`

## Boas práticas

- fixe a versão de Node no time
- rode `typecheck` e `test` no CI

## Anti-patterns

- misturar versões de runtime na equipe
- assumir que build passa se apenas `dev` sobe

## Performance

O build usa `tsup`; a execução de desenvolvimento usa `tsx`.

## Segurança

Nunca commite secrets em `.env`.

## FAQ

### O V12 suporta CommonJS?

Hoje a direção principal é ESM.

## Troubleshooting

### Sintoma

`npm run dev` não sobe.

### Possível causa

Versão de Node abaixo de `20`.

### Como validar

```bash
node -v
```

### Como corrigir

Atualize o runtime.

## Links relacionados

- [Quick Start](/introduction/quick-start)
- [Configuration](/concepts/configuration)
