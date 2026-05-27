# Sistema de Plugins

Este guia mostra quando vale a pena criar plugin no V12, como estruturar o ciclo de vida e como registrar funcionalidade global com o mínimo de atrito.

## Quando usar plugin

Plugin faz sentido quando você quer:

- compartilhar funcionalidade entre apps
- registrar providers globais
- adicionar rotas ou hooks transversais
- encapsular integração com ferramenta externa

Se a lógica pertence só a uma feature, normalmente um módulo comum resolve melhor.

## Primeiro plugin

```ts
import { definePlugin } from '@eddiecbrl/v12';

export const diagnosticsPlugin = definePlugin('diagnostics', async (app) => {
  app.get('/diagnostics', async () => ({
    uptime: process.uptime(),
  }));
});
```

Uso:

```ts
import { createApp } from '@eddiecbrl/v12';

const app = await createApp({
  plugins: [diagnosticsPlugin],
});
```

## Plugin com ciclo de vida

```ts
import { definePlugin } from '@eddiecbrl/v12';

export const lifecyclePlugin = definePlugin({
  name: 'lifecycle-plugin',
  onInit: async (app) => {
    app.log.info('init');
  },
  register: async (app) => {
    app.get('/plugin-check', async () => ({ ok: true }));
  },
  onReady: async (app) => {
    app.log.info('ready');
  },
  onClose: async (app) => {
    app.log.info('close');
  },
});
```

## Plugin com provider

```ts
import { definePlugin } from '@eddiecbrl/v12';

class ClockService {
  now() {
    return new Date();
  }
}

export const clockPlugin = definePlugin({
  name: 'clock-plugin',
  register: async (app) => {
    app.container.register({
      provide: 'ClockService',
      useClass: ClockService,
    });
  },
});
```

Depois, qualquer módulo pode resolver:

```ts
container.resolve('ClockService')
```

## Plugin com validação de configuração

```ts
import { definePlugin } from '@eddiecbrl/v12';
import { z } from 'zod';

export const externalApiPlugin = definePlugin({
  name: 'external-api',
  configSchema: z.object({
    apiKey: z.string(),
  }),
  register: async (app) => {
    app.log.info('external api plugin registered');
  },
});
```

Registro dinâmico:

```ts
await app.use(externalApiPlugin, {
  apiKey: 'secret-123',
});
```

## Fluxo mental útil

Pense assim:

1. o módulo é para domínio
2. o plugin é para capacidade transversal

Exemplos de bons candidatos a plugin:

- documentação OpenAPI
- telemetria externa
- cliente compartilhado de parceiro
- rota global de diagnóstico

## Cuidados

- não esconda regra de negócio importante dentro de plugin
- escolha `name` único e estável
- registre no container apenas o que realmente é global
- use `configSchema` quando o plugin aceitar opções externas

## Plugins que já aparecem no projeto

- `pluginOpenApi()`

Além disso, recursos como Redis, multipart e WebSocket são habilitados direto em `createApp()`, não como plugins V12 definidos por `definePlugin()`.

## Links relacionados

- [Plugins API](/api/plugins)
- [createApp](/api/create-app)
- [Swagger/OpenAPI](/api/swagger)
