import { buildApp } from './app.js';
import { defineConfig, env } from './core/config/env.js';

const config = defineConfig({
  PORT: env.number().default(3000),
  HOST: env.string().default('0.0.0.0'),
});

const bootstrap = async () => {
  const app = await buildApp();
  const envConfig = config.parse();

  await app.listen({
    port: envConfig.PORT,
    host: envConfig.HOST,
  });
};

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
