# Começando

Este guia ajudará você a criar sua primeira aplicação com o V12 do zero.

## Pré-requisitos

- Node.js (versão 18 ou superior)
- npm, yarn ou pnpm
- Conhecimento básico de TypeScript e APIs REST

## 1. Instalando a CLI

A forma mais fácil de começar é usando a CLI do V12.

```bash
npm install -g v12
```

## 2. Criando um Novo Projeto

Inicie um novo projeto usando o comando `init`.

```bash
v12 init my-api
cd my-api
npm install
```

## 3. Estrutura do Projeto

O projeto gerado segue uma arquitetura orientada a features:

```text
src/
  features/
    users/
      users.module.ts
      users.controller.ts
      users.service.ts
      users.routes.ts
  app.ts
  server.ts
.env
package.json
tsconfig.json
```

## 4. Criando seu Primeiro Módulo

Vamos criar um módulo de "Produtos".

```bash
v12 generate feature products
```

Isso criará a pasta `src/features/products` com os arquivos base e já registrará o módulo em `src/app.ts`.

## 5. Definindo Rotas e Lógica

Abra o arquivo `src/features/products/products.controller.ts` e defina sua lógica. O V12 incentiva o uso de classes para Controllers e Services.

```ts
import { RequestContext } from 'v12';

export class ProductsService {
  private products = [{ id: 1, name: 'Notebook', price: 2500 }];

  findAll() {
    return this.products;
  }

  create(data: any) {
    const newProduct = { ...data, id: this.products.length + 1 };
    this.products.push(newProduct);
    return newProduct;
  }
}

export class ProductsController {
  static inject = [ProductsService] as const;
  constructor(private service: ProductsService) {}

  list = async () => this.service.findAll();
  
  create = async ({ request }: RequestContext) => 
    this.service.create(request.body);
}
```

Agora, configure as rotas em `src/features/products/products.routes.ts`:

```ts
import { createRouter } from 'v12';
import { ProductsController } from './products.controller.js';

export const buildProductsRoutes = () => 
  createRouter()
    .get('/', {
      handler: ({ container }) => container.resolve(ProductsController).list()
    })
    .post('/', {
      handler: ({ container, request }) => 
        container.resolve(ProductsController).create({ request } as any)
    })
    .build();
```

## 6. Configurando o Módulo

No arquivo `products.module.ts`, registre os providers e o router.

```ts
import { defineModule } from 'v12';
import { ProductsController, ProductsService } from './products.controller.js';
import { buildProductsRoutes } from './products.routes.js';

export const ProductsModule = defineModule({
  name: 'products',
  providers: [ProductsService, ProductsController],
  routes: buildProductsRoutes()
});
```

## 7. Iniciando a Aplicação

No `src/app.ts`, registre seu módulo e adicione o plugin de documentação.

```ts
import { createApp, pluginOpenApi } from 'v12';
import { ProductsModule } from './features/products/products.module.js';

export const buildApp = () => 
  createApp({
    modules: [ProductsModule],
    plugins: [
      pluginOpenApi({
        title: 'Loja API',
        version: '1.0.0'
      })
    ]
  });
```

E no `src/server.ts` (já criado pelo `v12 init`), a aplicação será iniciada:

```ts
import { buildApp } from './app.js';

const app = await buildApp();
await app.listen({ port: 3000 });
console.log('Servidor rodando em http://localhost:3000');
```

## 8. Testando a API

Agora você pode rodar a aplicação:

```bash
npm run dev
```

E acessar:
- `GET http://localhost:3000/products`: Deve retornar a lista de produtos.
- `GET http://localhost:3000/docs`: Acesse a documentação interativa da sua API.

## Próximos Passos

Agora que você tem o básico funcionando, explore:
- [Conceitos de Módulos](/concepts/modules)
- [Injeção de Dependência](/concepts/containers)
- [Integração com Banco de Dados](/guides/database)
- [Autenticação e Segurança](/guides/authentication)
