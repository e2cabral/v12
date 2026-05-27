# Guia de Deploy

Aplicações V12 são aplicações Node.js padrão, o que significa que podem ser hospedadas em quase qualquer lugar.

## Build

Como o V12 usa TypeScript, você precisa compilar o código antes de enviar para produção. Recomendamos o uso de `tsup` ou o próprio `tsc`.

```bash
npm run build
```

Isso gerará os arquivos JavaScript na pasta `dist/`.

## Variáveis de Ambiente

Certifique-se de configurar as variáveis de ambiente necessárias no seu ambiente de produção:

- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL=...`
- `REDIS_URL=...`
- `JWT_SECRET=...`

## Execução

Para rodar a aplicação em produção, utilize o comando `node` apontando para o arquivo de entrada compilado.

```bash
node dist/main.js
```

### Process Managers

Recomendamos o uso de um gerenciador de processos como o [PM2](https://pm2.keymetrics.io/) para garantir que a aplicação reinicie automaticamente em caso de falha.

```bash
pm2 start dist/main.js --name my-api
```

## Docker

Usar Docker é a forma mais recomendada para garantir consistência entre ambientes.

### Dockerfile Exemplo

```dockerfile
# Build stage
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main.js"]
```

## CI/CD (GitHub Actions)

Você pode automatizar o build e deploy da sua aplicação usando o GitHub Actions.

```yaml
name: CI/CD
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      
  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      # Exemplo de build e push de imagem Docker
      - name: Build and Push Docker Image
        run: |
          docker build -t my-app:${{ github.sha }} .
          # Comandos para dar push no seu registry (ECR, GCR, DockerHub)
```

## Estratégias de Deploy

### Containers (Kubernetes / ECS / Cloud Run)

O V12 é ideal para ambientes de containers devido ao seu baixo tempo de startup e suporte nativo a health checks (`/health`) e métricas (`/metrics`).

### Serverless (AWS Lambda / Vercel)

Embora o V12 use Fastify, ele pode ser adaptado para ambientes serverless usando adaptadores como o `@fastify/aws-lambda`. No entanto, para melhor performance em serverless, certifique-se de gerenciar as conexões de banco de dados fora do handler.

## Boas Práticas de Produção

- **Logs**: Direcione os logs (stdout) para um agregador de logs.
- **Segurança**: Nunca inclua segredos no seu `Dockerfile` ou imagem Docker. Use segredos do provedor de cloud.
- **Escalabilidade**: Como o V12 é stateless por padrão, você pode escalar horizontalmente (múltiplas instâncias) sem problemas, desde que utilize um Redis para sessões/cache/filas se necessário.
