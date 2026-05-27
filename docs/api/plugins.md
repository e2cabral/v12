# Plugins API

O V12 é extensível através de plugins que permitem injetar lógica global, registrar novos providers e integrar com hooks do Fastify.

## Assinatura

Um plugin é uma função assíncrona que recebe a `AppInstance`.

```ts
import { AppInstance } from 'v12';

export const myPlugin = async (app: AppInstance) => {
  // lógica do plugin
};
```

## Registro

Plugins são registrados no `createApp` ou via `app.use()`.

```ts
const app = await createApp({
  plugins: [myPlugin],
});

// ou
await app.use(otherPlugin);
```

## Plugins Oficiais

- `pluginRateLimit(options)`: Proteção contra abusos.
- `pluginOpenApi(modules, options)`: Geração automática de documentação.

## Boas Práticas

- **Encapsulamento**: Plugins devem ser autocontidos e fáceis de desabilitar.
- **DI**: Utilize `app.container` para registrar serviços que devem estar disponíveis para toda a aplicação.
- **Namespacing**: Use nomes claros para os tokens registrados pelo plugin para evitar colisões.

## Links relacionados

- [Guia de Plugins](/guides/plugins)
- [createApp](/api/create-app)
