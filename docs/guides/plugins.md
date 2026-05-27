# Sistema de Plugins

O V12 é altamente extensível através de um sistema de plugins. Você pode criar seus próprios plugins para compartilhar funcionalidades entre diferentes aplicações ou para integrar bibliotecas externas.

## O Que é um Plugin?

Um plugin no V12 é uma função que recebe a instância da aplicação e pode registrar providers, middlewares, ou realizar qualquer configuração adicional.

```ts
import type { AppInstance } from 'v12';

export const myPlugin = async (app: AppInstance) => {
  // Registrar um provider global
  app.container.register({
    provide: 'MyService',
    useClass: MyService
  });

  // Adicionar um hook do Fastify
  app.addHook('onRequest', async (request) => {
    console.log('Plugin interceptou requisição');
  });
};
```

## Usando Plugins

Para usar um plugin, basta passá-lo no array `plugins` ao criar a aplicação.

```ts
import { createApp } from 'v12';
import { myPlugin } from './plugins/my-plugin.js';

const app = await createApp({
  plugins: [myPlugin],
});
```

## Plugins Oficiais e do Ecossistema

O V12 já vem com suporte facilitado para integração de plugins do Fastify, e alguns plugins core que podem ser habilitados:

- `pluginRateLimit`: Controle de taxa de requisições (baseado no `@fastify/rate-limit`).
- `pluginOpenApi`: Geração automática de documentação Swagger/Scalar (através da API de Swagger).
- `pluginMultiTenancy`: Middleware para isolamento de tenants.

## Criando Plugins com Opções

Se o seu plugin precisar de configurações, você pode usar uma factory function.

```ts
export type MyPluginOptions = {
  apiKey: string;
};

export const myPlugin = (options: MyPluginOptions) => {
  return async (app: AppInstance) => {
    app.container.register({
      provide: 'API_KEY',
      useValue: options.apiKey
    });
  };
};

// Uso:
createApp({
  plugins: [myPlugin({ apiKey: '123' })]
})
```

## Quando Criar um Plugin?

- Quando você quer reutilizar uma lógica de container (DI) em múltiplos projetos.
- Quando você quer integrar um plugin existente do Fastify mas precisa injetar dependências do V12 nele.
- Quando você quer adicionar comportamentos globais à aplicação (hooks, decoradores).

## Links relacionados

- [createApp API](/api/create-app)
- [Fastify Plugins](https://fastify.dev/docs/latest/Reference/Plugins/)
