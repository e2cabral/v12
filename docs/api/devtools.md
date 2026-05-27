# DevTools API

O V12 registra um painel simples de desenvolvimento e um endpoint JSON com informações da aplicação.

## Como funciona

`registerDevTools(app)` é chamado automaticamente dentro de `createApp()`.

Em produção (`NODE_ENV === 'production'`), ele não registra nada.

## Endpoints

- `GET /_v12/devtools`
- `GET /_v12/api/info`

## `GET /_v12/devtools`

Serve uma página HTML com:

- uptime
- uso de memória
- versão do Node
- rotas registradas
- módulos ativos

## `GET /_v12/api/info`

Retorna JSON com esta estrutura geral:

```json
{
  "success": true,
  "data": {
    "version": "0.1.0",
    "nodeVersion": "v22.x",
    "uptime": 123.45,
    "memory": {},
    "routes": "string formatada",
    "modules": []
  }
}
```

## Exemplo de acesso

Depois de subir a app em desenvolvimento:

- `http://localhost:3000/_v12/devtools`
- `http://localhost:3000/_v12/api/info`

## O que entra em `modules`

Cada módulo informado na app contribui com:

- `name`
- `prefix`
- `providers`

Esses dados são úteis para conferir se um módulo foi realmente carregado e se os providers esperados estão na composição.

## Registro manual

Embora `createApp()` já cuide disso, a função também pode ser chamada manualmente:

```ts
import { registerDevTools } from '@eddiecbrl/v12';

registerDevTools(app);
```

## Quando isso ajuda

- depurar rotas que não apareceram
- confirmar prefixos finais
- inspecionar composição de módulos
- verificar se um ambiente local está rodando a versão certa

## Limites

- o endpoint é voltado a desenvolvimento
- os dados de rotas vêm em formato textual via `app.printRoutes()`
- em produção ele é desabilitado pelo guard de `NODE_ENV`

## Links relacionados

- [createApp](/api/create-app)
- [Arquitetura de Bootstrap](/architecture/bootstrap)
- [Observabilidade](/guides/observability)
