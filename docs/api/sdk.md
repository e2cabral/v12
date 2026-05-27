# SDK API

O V12 inclui geração de SDK TypeScript a partir das rotas registradas na aplicação.

## Como funciona

O gerador percorre os módulos e rotas, lê os schemas e produz um cliente tipado.

## Via CLI

O caminho principal é:

```bash
npx v12 sdk --output ./sdk.ts --url http://localhost:3000
```

Esse comando espera encontrar `buildApp()` exportado em `src/app.ts`.

## Via código

```ts
import { generateSDK } from '@eddiecbrl/v12';

const sdkCode = generateSDK(app, {
  baseUrl: 'https://api.myapp.com',
});
```

Depois você grava esse conteúdo no arquivo desejado.

## O que isso traz

- cliente tipado
- sincronização melhor entre backend e frontend
- menos fetch manual repetitivo

## Observação importante

A API atual expõe `generateSDK(app, options?)` para gerar o código, enquanto a CLI cuida da leitura de `src/app.ts` e da gravação em arquivo.

## Links relacionados

- [CLI](/api/cli)
- [createRouter](/api/create-router)
