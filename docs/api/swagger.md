# Swagger & OpenAPI

O V12 gera documentação OpenAPI a partir das rotas e schemas declarados no framework. A interface visual é servida com Scalar.

## Plugin principal

O recurso é habilitado por `pluginOpenApi()`.

## Assinatura

```ts
pluginOpenApi(modulesOrOptions, options?)
```

Você pode usar de duas formas:

## 1. Usando os módulos já registrados na app

```ts
import { createApp, pluginOpenApi } from '@eddiecbrl/v12';

const app = await createApp({
  modules: [UsersModule],
  plugins: [
    pluginOpenApi({
      title: 'Minha API',
      version: '1.0.0',
      description: 'Documentação técnica da API',
    }),
  ],
});
```

## 2. Passando explicitamente a lista de módulos

```ts
pluginOpenApi([UsersModule], {
  title: 'Minha API',
  version: '1.0.0',
})
```

Isso é útil quando você quer documentar um subconjunto de módulos.

## Opções disponíveis

- `title`
- `version`
- `description`
- `path` padrão `/openapi.json`
- `docsPath` padrão `/docs`

## Exemplo completo

```ts
import { createApp, createRouter, defineModule, pluginOpenApi } from '@eddiecbrl/v12';
import { z } from 'zod';

const router = createRouter();

router.post('/', {
  schema: {
    body: z.object({
      name: z.string().describe('Nome do catálogo'),
    }),
  },
  handler: async () => ({ ok: true }),
});

const CatalogModule = defineModule({
  name: 'catalog',
  routes: router.build(),
});

const app = await createApp({
  modules: [CatalogModule],
  plugins: [
    pluginOpenApi({
      title: 'Catalog API',
      version: '1.0.0',
      description: 'API de catálogo',
    }),
  ],
});
```

## O que é gerado

Quando o plugin está ativo:

- `GET /openapi.json`
- `GET /docs`

Você pode customizar ambos os paths.

## Como o documento é montado

O builder atual:

- usa `openapi: '3.1.0'`
- cria `info.title`, `info.version` e `info.description`
- agrupa rotas por módulo em `tags`
- converte schemas Zod para JSON Schema/OpenAPI
- documenta `body`, `params`, `querystring` e `headers`

## O que entra automaticamente

### Tags

Cada operação recebe a tag do nome do módulo.

### Operation ID

O framework gera `operationId` automaticamente a partir de método + path.

### Request body

Se a rota tiver `schema.body`, ele entra em `requestBody`.

### Parameters

Se a rota tiver:

- `schema.params`
- `schema.querystring`
- `schema.headers`

eles entram em `parameters`.

## Exemplo de schema documentado

```ts
import { z } from 'zod';

const schema = {
  params: z.object({
    id: z.string().min(1).describe('ID do usuário'),
  }),
  querystring: z.object({
    includePosts: z.enum(['true', 'false']).optional(),
  }),
  body: z.object({
    name: z.string().min(2),
  }),
};
```

## Interface visual

`/docs` retorna uma página HTML com Scalar apontando para o JSON OpenAPI.

Na prática, isso dá uma documentação navegável com:

- lista de endpoints
- schemas de entrada
- parâmetros
- exemplos de payload conforme os tipos

## Limites atuais

É bom saber o que a implementação atual faz e o que ela ainda não faz:

- respostas são documentadas com um envelope genérico de sucesso `success/data`
- não há descrição detalhada de respostas por status por rota
- a documentação se apoia sobretudo nos schemas de entrada

Ou seja: já é bastante útil para onboarding, exploração e geração de cliente, mas ainda não substitui doc funcional mais rica quando você precisa detalhar regras de negócio complexas.

## Dicas

- use `.describe()` no Zod para enriquecer os schemas
- mantenha `title` e `version` corretos
- em produção, avalie proteger ou desabilitar `/docs`
- se for gerar SDK externo, publique também o `/openapi.json`

## Links relacionados

- [Validation](/api/validation)
- [Plugins](/api/plugins)
- [createApp](/api/create-app)
