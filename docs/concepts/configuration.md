# Configuration

No V12, configuração entra cedo no bootstrap e deve falhar cedo quando algo essencial estiver faltando.

## Modelo atual

O projeto usa builders de ambiente com `defineConfig()` e `env.*()`.

```ts
import { defineConfig, env } from '@eddiecbrl/v12';

const config = defineConfig({
  PORT: env.number().default(3000),
  HOST: env.string().default('0.0.0.0'),
  JWT_SECRET: env.string(),
  ENABLE_DOCS: env.boolean().default(true),
});

const parsed = config.parse();
```

## Por que isso ajuda

- tipa os valores na saída
- faz coerção de número e boolean
- concentra a definição de config
- reduz parsing espalhado pelo projeto

## Onde colocar

Um arranjo simples:

```txt
src/
  config/
    app.config.ts
  app.ts
  server.ts
```

## Exemplo prático

`src/config/app.config.ts`

```ts
import { defineConfig, env } from '@eddiecbrl/v12';

export const appConfig = defineConfig({
  PORT: env.number().default(3000),
  HOST: env.string().default('0.0.0.0'),
  JWT_SECRET: env.string(),
});
```

`src/server.ts`

```ts
import { buildApp } from './app.js';
import { appConfig } from './config/app.config.js';

const bootstrap = async () => {
  const envConfig = appConfig.parse();
  const app = await buildApp();

  await app.listen({
    port: envConfig.PORT,
    host: envConfig.HOST,
  });
};
```

## Registrando no container

Se muitos services precisam da mesma config:

```ts
const parsedConfig = appConfig.parse();

const app = await createApp({
  providers: [
    {
      provide: 'AppConfig',
      useValue: parsedConfig,
    },
  ],
});
```

Depois:

```ts
class ExternalService {
  static inject = ['AppConfig'] as const;

  constructor(private readonly config: any) {}
}
```

## Defaults vs obrigatórios

Uma regra saudável:

- defaults para host, porta e flags locais
- obrigatórios para segredos, URLs críticas e chaves externas

## Boas práticas

- centralize config
- faça parse uma vez
- não espalhe `process.env` pelo domínio
- use tokens claros como `'AppConfig'`

## Links relacionados

- [Config API](/api/config)
- [Containers](/concepts/containers)
