# Logger API

O V12 utiliza o [Pino](https://getpino.io/) como logger padrão, fornecendo logs estruturados e de alta performance.

## Uso Básico

O logger está disponível no container global e pode ser injetado em qualquer service. Por padrão, ele usa o token `'Logger'`.

```ts
import { Logger } from 'v12';

export class UsersService {
  constructor(private logger: Logger) {}

  async create(data: any) {
    this.logger.info({ userId: data.id }, 'Criando novo usuário');
    
    try {
      // ... lógica
    } catch (error) {
      this.logger.error({ error, data }, 'Erro ao criar usuário');
      throw error;
    }
  }
}
```

## Níveis de Log

Os níveis padrão do Pino são suportados:

- `trace`
- `debug`
- `info`
- `warn`
- `error`
- `fatal`

## Logs de Requisição

O V12 registra automaticamente logs de entrada e saída para todas as requisições HTTP, incluindo o tempo de resposta e o ID da requisição (`x-request-id`).

## Configuração

Você pode configurar o logger através de variáveis de ambiente:

- `LOG_LEVEL`: Define o nível mínimo de log (padrão: `info`).
- `NODE_ENV`: Se definido como `development`, o log será formatado com `pino-pretty` para melhor legibilidade no terminal.

## Boas Práticas

- **Use logs estruturados**: Sempre passe um objeto como primeiro argumento para incluir metadados pesquisáveis (ex: `userId`, `orderId`).
- **Não logue dados sensíveis**: Evite logar senhas, tokens, números de cartão de crédito ou documentos pessoais.
- **Contexto é tudo**: Inclua informações suficientes para que seja possível rastrear um erro sem precisar reproduzi-lo localmente.
