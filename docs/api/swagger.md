# Swagger & OpenAPI

O V12 possui suporte nativo para geração automática de documentação da API usando o padrão OpenAPI 3.1.

## Como Funciona

Sempre que você define rotas usando Schemas do Zod, o framework é capaz de ler essas definições e gerar um documento JSON completo descrevendo os endpoints, parâmetros de entrada, tipos de dados e respostas.

## Habilitando a Documentação

Para habilitar a documentação, utilize o plugin `pluginOpenApi` no seu `createApp`.

```ts
import { createApp, pluginOpenApi } from 'v12';
import { modules } from './modules.js'; // Sua lista de módulos

const app = await createApp({
  modules,
  plugins: [
    pluginOpenApi({
      title: 'Minha API Fantástica',
      version: '1.0.0',
      description: 'Documentação técnica dos endpoints do sistema.',
      path: '/openapi.json', // URL do arquivo JSON
      docsPath: '/docs'      // URL da interface visual
    })
  ]
});
```

Você também pode passar os módulos explicitamente como primeiro argumento se desejar filtrar ou usar uma lista diferente da global:

```ts
pluginOpenApi(modules, { title: 'API', version: '1.0.0' })
```

## Interface Visual (Scalar)

Por padrão, o V12 utiliza o [Scalar](https://scalar.com/) para renderizar uma interface bonita e interativa da sua documentação. Ela fica disponível no caminho definido em `docsPath` (ex: `http://localhost:3000/docs`).

A interface permite:
-   Visualizar todos os endpoints agrupados por módulos (tags).
-   Explorar os schemas de entrada e saída.
-   Testar as requisições diretamente pelo navegador (Try it out).

## Metadados das Rotas

Você pode enriquecer a documentação adicionando metadados às suas rotas.

```ts
router.get('/:id', {
  schema: { /* ... */ },
  // O V12 extrai automaticamente o nome do módulo como tag
  handler: async () => { /* ... */ }
});
```

## Exportando o JSON

Se você precisar do arquivo OpenAPI para importar em ferramentas como Postman, Insomnia ou para gerar SDKs, basta acessar a URL definida em `path` (ex: `/openapi.json`).

## Boas Práticas

-   **Descrições Claras**: Adicione descrições aos seus schemas Zod usando `.describe()`, elas aparecerão na documentação.
-   **Segurança**: Em produção, você pode querer proteger o endpoint de documentação ou desabilitá-lo completamente.
-   **Versionamento**: Mantenha o campo `version` atualizado para que os consumidores da sua API saibam quando houve mudanças estruturais.

## Links relacionados

- [Scalar Documentation](https://scalar.com/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Validation API](/api/validation)
