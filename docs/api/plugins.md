# Plugins API

O V12 é extensível por plugins registrados no bootstrap ou dinamicamente via `app.use()`.

## O que é um plugin no V12

Um plugin é um objeto com:

- `name`
- `register(app)`
- opcionalmente `onInit(app)`
- opcionalmente `onReady(app)`
- opcionalmente `onClose(app)`
- opcionalmente `configSchema`

## Tipo base

```ts
type V12Plugin = {
  name: string;
  register: (app: AppInstance) => Promise<void> | void;
  onInit?: (app: AppInstance) => Promise<void> | void;
  onReady?: (app: AppInstance) => Promise<void> | void;
  onClose?: (app: AppInstance) => Promise<void> | void;
  configSchema?: any;
};
```

## `definePlugin()`

O helper `definePlugin()` aceita três formatos.

## 1. Nome + função

```ts
import { definePlugin } from '@eddiecbrl/v12';

export const healthPlugin = definePlugin('health-plugin', async (app) => {
  app.get('/plugin-health', async () => ({ ok: true }));
});
```

## 2. Função + nome opcional

```ts
const registerPlugin = async (app: any) => {
  app.get('/ping-plugin', async () => ({ pong: true }));
};

export const plugin = definePlugin(registerPlugin, 'ping-plugin');
```

## 3. Objeto completo

```ts
import { definePlugin } from '@eddiecbrl/v12';
import { z } from 'zod';

export const myPlugin = definePlugin({
  name: 'my-plugin',
  configSchema: z.object({
    apiKey: z.string(),
  }),
  onInit: async (app) => {
    app.log.info('plugin init');
  },
  register: async (app) => {
    app.get('/plugin-check', async () => ({ plugin: 'ok' }));
  },
  onReady: async (app) => {
    app.log.info('plugin ready');
  },
  onClose: async (app) => {
    app.log.info('plugin close');
  },
});
```

## Como registrar plugins

## Registro estático no `createApp()`

```ts
import { createApp } from '@eddiecbrl/v12';

const app = await createApp({
  plugins: [myPlugin],
});
```

## Registro dinâmico com `app.use()`

```ts
await app.use(myPlugin, { apiKey: 'secret-123' });
```

O `use()` é decorado na instância da app e delega o trabalho ao `PluginRegistry`.

## Ciclo de vida

Na prática, a ordem é:

1. valida `configSchema`, se houver e se foi passado `config`
2. evita duplicação por `name`
3. executa `onInit`
4. executa `register`
5. registra `onClose` no Fastify
6. dispara `onReady` quando a app entra em `onReady`

## Exemplo com provider global

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

## Exemplo com rota adicional

```ts
export const diagnosticsPlugin = definePlugin('diagnostics', async (app) => {
  app.get('/diagnostics', async () => ({
    uptime: process.uptime(),
  }));
});
```

## Plugins oficiais visíveis no código atual

- `pluginOpenApi(...)`

Além disso, o framework já integra recursos opcionais no próprio `createApp`, como Redis, multipart e WebSocket, embora eles não sejam plugins V12 no mesmo formato de `definePlugin()`.

## Validação de configuração

Se `configSchema` tiver um método `parse`, ele será usado para validar o objeto passado para `app.use(plugin, config)`.

Exemplo:

```ts
await app.use(myPlugin, {
  apiKey: 'abc',
});
```

Se a validação falhar, o framework lança erro com código:

```txt
PLUGIN_CONFIG_INVALID
```

## Duplicação de plugins

Se o mesmo `name` for registrado mais de uma vez, o registry ignora o segundo e escreve warning no logger.

## Quando faz sentido criar plugin

Crie plugin quando a funcionalidade:

- é global para a aplicação
- precisa registrar providers globais
- adiciona rotas, hooks ou integrações transversais
- deve poder ser ligada ou desligada sem mexer em módulos de domínio

## Quando não precisa ser plugin

Talvez um plugin seja exagero quando:

- a lógica é específica de uma única feature
- basta um provider local do módulo
- a funcionalidade só vive dentro de uma rota ou service

## Links relacionados

- [Guia de Plugins](/guides/plugins)
- [createApp](/api/create-app)
- [Swagger/OpenAPI](/api/swagger)
