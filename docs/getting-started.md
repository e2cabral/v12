# Começando

Este guia monta uma primeira aplicação V12 de forma mais próxima do uso real do framework: com feature separada, controller, service, schemas e bootstrap dedicado.

Se você quer o caminho mais curto possível, leia antes o [Quick Start](/introduction/quick-start).

## O que vamos construir

Uma API com:

- feature `products`
- `GET /products`
- `POST /products`
- validação de body com Zod
- documentação OpenAPI em `/docs`

## Pré-requisitos

- Node.js `20+`
- dependências instaladas
- `zod` disponível no projeto

## 1. Instale o framework

```bash
npm install @eddiecbrl/v12 zod
```

## 2. Entenda a estrutura

Uma estrutura inicial boa para uma aplicação V12 fica assim:

```txt
src/
  features/
    products/
      products.module.ts
      products.routes.ts
      products.controller.ts
      products.service.ts
      products.schemas.ts
  app.ts
  server.ts
```

## 3. Crie os schemas da feature

`src/features/products/products.schemas.ts`

```ts
import { z } from 'zod';

export const createProductSchema = {
  body: z.object({
    name: z.string().min(2),
    price: z.number().positive(),
  }),
};

export type CreateProductInput = z.infer<typeof createProductSchema.body>;
```

## 4. Crie o service

`src/features/products/products.service.ts`

```ts
import crypto from 'node:crypto';
import type { CreateProductInput } from './products.schemas.js';

export class ProductsService {
  private readonly products: Array<{ id: string; name: string; price: number }> = [
    { id: crypto.randomUUID(), name: 'Notebook', price: 2500 },
  ];

  findAll() {
    return this.products;
  }

  create(data: CreateProductInput) {
    const product = { id: crypto.randomUUID(), ...data };
    this.products.push(product);
    return product;
  }
}
```

## 5. Crie o controller

`src/features/products/products.controller.ts`

```ts
import type { RequestContext } from '@eddiecbrl/v12';
import { ProductsService } from './products.service.js';
import type { CreateProductInput } from './products.schemas.js';

export class ProductsController {
  static inject = [ProductsService] as const;

  constructor(private readonly service: ProductsService) {}

  list = async () => this.service.findAll();

  create = async ({ request }: RequestContext) =>
    this.service.create(request.body as CreateProductInput);
}
```

## 6. Crie as rotas

`src/features/products/products.routes.ts`

```ts
import { createRouter } from '@eddiecbrl/v12';
import { ProductsController } from './products.controller.js';
import { createProductSchema } from './products.schemas.js';

const router = createRouter();

router.get('/', {
  handler: ({ container }) => container.resolve(ProductsController).list(),
});

router.post('/', {
  schema: createProductSchema,
  handler: ({ container, request }) =>
    container.resolve(ProductsController).create({ request } as any),
});

export const productsRoutes = router.build();
```

> Repare num detalhe importante: os métodos do router não são encadeáveis no estado atual da API. O padrão correto é declarar cada rota e só então chamar `build()`.

## 7. Defina o módulo

`src/features/products/products.module.ts`

```ts
import { defineModule } from '@eddiecbrl/v12';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { productsRoutes } from './products.routes.js';

export const ProductsModule = defineModule({
  name: 'products',
  providers: [ProductsService, ProductsController],
  routes: productsRoutes,
});
```

## 8. Monte a aplicação

`src/app.ts`

```ts
import { createApp, pluginOpenApi } from '@eddiecbrl/v12';
import { ProductsModule } from './features/products/products.module.js';

export const buildApp = () =>
  createApp({
    modules: [ProductsModule],
    security: {
      cors: true,
      helmet: true,
    },
    plugins: [
      pluginOpenApi({
        title: 'Loja API',
        version: '1.0.0',
        description: 'API de exemplo criada com V12',
      }),
    ],
  });
```

## 9. Suba o servidor

`src/server.ts`

```ts
import { buildApp } from './app.js';

const app = await buildApp();

await app.listen({
  port: 3000,
  host: '0.0.0.0',
});

console.log('Servidor rodando em http://localhost:3000');
```

## 10. Teste a API

Rodando a aplicação:

```bash
npm run dev
```

Chamadas úteis:

```bash
curl http://localhost:3000/products
```

```bash
curl -X POST http://localhost:3000/products \
  -H "content-type: application/json" \
  -d "{\"name\":\"Mouse\",\"price\":199.9}"
```

Abra também:

- `http://localhost:3000/`
- `http://localhost:3000/health`
- `http://localhost:3000/metrics`
- `http://localhost:3000/docs`

## Onde a CLI ajuda

Se você preferir gerar parte da estrutura:

```bash
npx v12 init
npx v12 generate feature products
npx v12 generate route products create --method POST --path /
npx v12 generate service products pricing
```

## Boas práticas desde cedo

- deixe o controller fino e mova regra para o service
- concentre schemas de entrada perto da feature
- mantenha `app.ts` como lugar de composição
- use `server.ts` apenas para `listen`
- trate `src/features/<nome>` como boundary de domínio

## Próximos passos

- [Módulos](/concepts/modules)
- [Containers](/concepts/containers)
- [Banco de Dados](/guides/database)
- [Autenticação](/guides/authentication)
- [Swagger/OpenAPI](/api/swagger)
