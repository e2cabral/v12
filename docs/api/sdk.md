# SDK API

O V12 possui um gerador de SDK integrado que cria automaticamente um cliente TypeScript tipado para sua API. Isso garante que o seu frontend esteja sempre em sincronia com o backend.

## Como funciona

O gerador percorre todos os módulos e rotas registrados, extrai os schemas do Zod e gera:
1. Interfaces TypeScript para todos os inputs e outputs.
2. Uma classe cliente com métodos para cada endpoint.

## Gerando via CLI

A forma mais comum de gerar o SDK é através da CLI.

```bash
v12 sdk generate --output ../frontend/src/api/sdk.ts
```

## Gerando via Código

Você também pode disparar a geração do SDK programmaticamente.

```ts
import { generateSDK } from 'v12';

await generateSDK(app, {
  output: './sdk.ts',
  baseUrl: 'https://api.myapp.com'
});
```

## Usando o SDK no Frontend

O SDK gerado utiliza `fetch` por padrão e é totalmente tipado.

```ts
import { ApiClient } from './sdk';

const api = new ApiClient({
  baseUrl: 'http://localhost:3000',
  headers: () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  })
});

// Chamada tipada: o compilador sabe o que enviar e o que esperar
const users = await api.users.findAll({ role: 'admin' });
```

## Vantagens

- **Segurança de Tipos**: Erros de contrato entre frontend e backend são detectados em tempo de compilação.
- **Auto-complete**: Seu editor mostrará todos os endpoints e parâmetros disponíveis.
- **Produtividade**: Não é necessário escrever manualmente as funções de fetch e as interfaces.

## Links relacionados

- [CLI Reference](/api/cli)
- [createRouter (Schemas)](/api/create-router)
