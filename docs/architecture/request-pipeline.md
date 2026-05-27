# Request Pipeline

O Request Pipeline é a espinha dorsal do processamento de mensagens no V12. Ele garante que cada requisição HTTP passe por uma série de transformações e validações antes de chegar à lógica de negócio e, finalmente, ser devolvida ao cliente.

## Estrutura do Pipeline

O pipeline é projetado como uma cebola (onion architecture) ou uma série de camadas sequenciais:

### 1. Camada de Contexto e Infraestrutura
Assim que a requisição chega, o V12 cria o `RequestContext`.
-   **Trace ID**: Um ID único (`x-request-id`) é gerado ou recuperado dos cabeçalhos.
-   **Logger Contextual**: Um logger é anexado à requisição com o Trace ID injetado.
-   **DI Child Container**: Um novo container é criado para permitir a injeção de dependências no escopo da requisição.

### 2. Camada de Middlewares Globais
Estes são os middlewares registrados diretamente no servidor Fastify ou via configuração do `createApp`. Eles processam todas as requisições (ex: CORS, compressão, parse de cookies).

### 3. Camada de Middlewares de Módulo e Rota
Middlewares definidos na estrutura de módulos ou especificamente em uma rota. Eles são executados na ordem em que foram declarados.
-   **Exemplo**: Middleware de `multi-tenancy` que extrai o ID do tenant antes de qualquer outra operação.

### 4. Camada de Segurança (Guards)
Os Guards são middlewares especializados em proteção.
-   **Authentication**: Verifica se o token JWT ou API Key é válido.
-   **Authorization**: Verifica se o usuário tem as permissões (`roles` ou `scopes`) necessárias para acessar aquele endpoint.

### 5. Camada de Validação de Dados
Nesta etapa, o V12 aplica os schemas de validação definidos na rota.
-   **Input**: Valida Body, Query e Params. Se houver erro, a execução é interrompida com um `ValidationError`.
-   **Output (Opcional)**: Alguns fluxos podem validar o formato da resposta enviada.

### 6. Camada de Aplicação (Handler)
O ponto de destino da requisição. O Handler resolve os Services necessários do container e executa a tarefa. O retorno desta função (geralmente um objeto simples ou uma Promise) segue para a próxima camada.

### 7. Camada de Resposta e Serialização
O Fastify assume o controle para transformar o objeto de retorno em uma string JSON, define o `Content-Type` e envia a resposta TCP ao cliente.

## Vantagens desta abordagem

-   **Separação de Preocupações**: A lógica de negócio no Handler não se preocupa com autenticação ou validação de formato.
-   **Interrupção Precoce**: Se um token é inválido, o pipeline para na camada 4, economizando recursos de processamento e banco de dados.
-   **Consistência**: Todas as rotas do seu sistema seguem exatamente o mesmo fluxo, facilitando a manutenção global.

## Links relacionados

- [Execution Concepts](/concepts/execution)
- [createRouter API](/api/create-router)
- [Middlewares & Guards](/api/security)
