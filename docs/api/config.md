# Config API

O V12 oferece utilitários para gerenciar configurações e variáveis de ambiente de forma segura e tipada.

## Variáveis de Ambiente

O V12 carrega automaticamente arquivos `.env` na raiz do projeto durante o bootstrap.

### getEnv

Busca uma variável de ambiente e permite definir um valor padrão ou lançar erro se não encontrada.

```ts
import { getEnv } from 'v12';

const port = getEnv('PORT', '3000');
const secret = getEnv('JWT_SECRET'); // Lança erro se não existir em produção
```

## Configuração Baseada em Container

A forma recomendada de gerenciar configurações complexas é registrá-las como `providers` no container de DI.

```ts
// main.ts
const config = {
  api: {
    version: 'v1',
    timeout: 5000
  },
  thirdParty: {
    apiKey: getEnv('SERVICE_API_KEY')
  }
};

const app = await createApp({
  providers: [
    { provide: 'AppConfig', useValue: config }
  ],
  // ...
});
```

## Uso de Configurações

Injete suas configurações onde for necessário.

```ts
export class ExternalService {
  constructor(@Inject('AppConfig') private config: any) {}

  async call() {
    const { apiKey } = this.config.thirdParty;
    // ...
  }
}
```

## Variáveis Reservadas

O V12 utiliza algumas variáveis de ambiente por padrão:

- `NODE_ENV`: `development`, `production` ou `test`.
- `PORT`: Porta do servidor HTTP (padrão: `3000`).
- `LOG_LEVEL`: Nível do logger (`info`, `debug`, etc.).
- `DATABASE_URL`: URL de conexão com o banco de dados.
- `REDIS_URL`: URL de conexão com o Redis.

## Boas Práticas

- **Valide as configurações**: Use bibliotecas como `zod` para validar o objeto de configuração ao iniciar a aplicação.
- **Não commite segredos**: Nunca inclua arquivos `.env` no controle de versão. Use `.env.example` como template.
- **Fail fast**: Se uma configuração crítica estiver faltando, a aplicação deve falhar imediatamente ao iniciar.
