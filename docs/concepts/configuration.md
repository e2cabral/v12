# Configuration

O V12 adota a filosofia de "Twelve-Factor App", onde a configuração é estritamente separada do código através de variáveis de ambiente.

## Variáveis de Ambiente

O framework carrega automaticamente arquivos `.env` localizados na raiz do projeto. Para acessar essas variáveis de forma segura, use o utilitário `getEnv`.

```ts
import { getEnv } from 'v12';

// Com valor padrão
const port = getEnv('PORT', '3000');

// Obrigatória (lança erro se não encontrada em produção)
const dbUrl = getEnv('DATABASE_URL');
```

## Configuração Tipada

Para projetos maiores, a recomendação é criar um objeto de configuração centralizado e registrá-lo no container de DI. Isso facilita a manutenção e permite validar os valores na inicialização.

```ts
// src/config/app.config.ts
import { getEnv } from 'v12';

export const appConfig = {
  port: Number(getEnv('PORT', '3000')),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  jwt: {
    secret: getEnv('JWT_SECRET'),
    expiresIn: '1d'
  }
};

// main.ts
const app = await createApp({
  providers: [
    { provide: 'AppConfig', useValue: appConfig }
  ],
  // ...
});
```

## Uso de Providers de Configuração

Ao injetar a configuração em seus services, você ganha facilidade para testes (mocking) e desacoplamento.

```ts
export class AuthService {
  constructor(@Inject('AppConfig') private config: typeof appConfig) {}

  generateToken(user: User) {
    return jwt.sign({ id: user.id }, this.config.jwt.secret);
  }
}
```

## Configurações Reservadas

O core do V12 utiliza as seguintes chaves de ambiente:

- `NODE_ENV`: Define o comportamento de logs e erros (`development`, `production`, `test`).
- `PORT`: Porta do servidor HTTP.
- `LOG_LEVEL`: Nível de verbosidade do Logger.
- `DATABASE_URL`: String de conexão para o plugin de banco de dados.
- `REDIS_URL`: String de conexão para Cache e Queues.

## Boas Práticas

- **Validação de Schema**: Use bibliotecas como `zod` ou `joi` para validar o objeto de configuração antes de iniciar o app.
- **Fail Fast**: Se uma configuração essencial estiver faltando, o app deve parar imediatamente.
- **Secrets**: Nunca commite arquivos `.env` ou segredos no Git. Use segredos do provedor de cloud ou arquivos `.env.example`.
- **Defaults Sensatos**: Forneça valores padrão para ambiente de desenvolvimento, mas exija valores explícitos para produção.

## Links relacionados

- [Config API](/api/config)
- [createApp](/api/create-app)
- [Dependency Injection](/concepts/containers)
