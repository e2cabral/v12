import {
  existsSync,
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

export const initProject = () => {
  const cwd = process.cwd();
  const results: { path: string; status: 'created' | 'exists' }[] = [];

  const files = [
    {
      path: join('src', 'app.ts'),
      content: `import { createApp, pluginOpenApi } from '@eddiecbrl/v12';

export const buildApp = () =>
  createApp({
    modules: [],
    plugins: [
      pluginOpenApi({
        title: 'V12 API',
        version: '1.0.0',
      })
    ]
  });
`,
    },
    {
      path: join('src', 'server.ts'),
      content: `import { buildApp } from './app.js';
import { defineConfig, env } from '@eddiecbrl/v12';

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
`,
    },
  ];

  for (const file of files) {
    const fullPath = join(cwd, file.path);
    const dir = join(cwd, file.path, '..');

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    if (!existsSync(fullPath)) {
      writeFileSync(fullPath, file.content);
      results.push({ path: file.path, status: 'created' });
    } else {
      results.push({ path: file.path, status: 'exists' });
    }
  }

  return results;
};
