# Config API

O V12 expõe uma API pequena e tipada para configuração baseada em ambiente:

- `env.string()`
- `env.number()`
- `env.boolean()`
- `defineConfig()`

## Modelo atual

Ao contrário de helpers como `getEnv()`, o código atual trabalha com um schema declarativo usando Zod por baixo.

## Exemplo básico

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

## `env.string()`

Cria um builder para string.

```ts
JWT_SECRET: env.string()
```

## `env.number()`

Coage o valor para número.

```ts
PORT: env.number().default(3000)
```

Se o valor não for numérico, a validação falha.

## `env.boolean()`

Coage o valor para boolean.

```ts
ENABLE_DOCS: env.boolean().default(false)
```

## `.default(value)`

Define valor padrão.

```ts
HOST: env.string().default('0.0.0.0')
```

## `.required()`

Mantém o builder explícito como obrigatório.

```ts
JWT_SECRET: env.string().required()
```

Na prática, o builder já é obrigatório por padrão quando você não define `default`, então esse método é mais útil como sinal de intenção.

## `defineConfig(shape)`

Recebe um shape de builders e devolve:

- `parse(source?)`
- `schema`

## `parse(source?)`

Faz o parse a partir de `process.env` ou de uma fonte customizada.

### Com `process.env`

```ts
const envConfig = config.parse();
```

### Com objeto customizado

```ts
const envConfig = config.parse({
  PORT: '4000',
  HOST: '127.0.0.1',
  JWT_SECRET: 'secret',
  ENABLE_DOCS: 'true',
});
```

## Exemplo em `server.ts`

```ts
import { buildApp } from './app.js';
import { defineConfig, env } from '@eddiecbrl/v12';

const config = defineConfig({
  PORT: env.number().default(3000),
  HOST: env.string().default('0.0.0.0'),
});

const bootstrap = async () => {
  const app = await buildApp();
  const envConfig = config.parse();

  await app.listen({
    port: envConfig.PORT,
    host: envConfig.HOST,
  });
};
```

## Registrando config no container

Quando a configuração é usada por muitos services, vale registrá-la como provider:

```ts
const appConfig = config.parse();

const app = await createApp({
  providers: [
    {
      provide: 'AppConfig',
      useValue: appConfig,
    },
  ],
});
```

Depois:

```ts
class ExternalService {
  static inject = ['AppConfig'] as const;

  constructor(private readonly config: any) {}

  async call() {
    return this.config.JWT_SECRET;
  }
}
```

## O que essa API resolve bem

- fail fast no bootstrap
- coerção de tipos comuns
- tipagem de retorno
- centralização da configuração da aplicação

## Boas práticas

- concentre a definição de config em um único módulo
- registre config parseada no container quando várias partes da app dependem dela
- use defaults só para valores realmente opcionais
- trate segredos como obrigatórios

## Links relacionados

- [Conceitos de Configuração](/concepts/configuration)
- [createApp](/api/create-app)
