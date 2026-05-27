import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app';
import { createRouter } from '../src/core/http/router';
import { defineModule } from '../src/core/http/module';
import { generateSDK } from '../src/core/sdk/generator';
import { z } from 'zod';

describe('v12 SDK Generation', () => {
  it('deve gerar código TypeScript com tipagem forte a partir de Zod', async () => {
    const router = createRouter();
    router.post('/login', {
      schema: {
        body: z.object({
          username: z.string(),
          password: z.string()
        }),
        response: z.object({
          token: z.string()
        })
      },
      handler: () => ({ token: 'secret' })
    });

    const module = defineModule({
      name: 'Auth',
      routes: router.build()
    });

    const app = await createApp({
      modules: [module]
    });

    const sdkCode = generateSDK(app);

    expect(sdkCode).toContain('login_post: (options: {');
    expect(sdkCode).toContain('body: { username: string; password: string }');
    expect(sdkCode).toContain("this.request<{ token: string }>('POST', '/Auth/login', options)");
  });

  it('deve lidar com enums e opcionais', async () => {
    const router = createRouter();
    router.get('/search', {
      schema: {
        querystring: z.object({
          q: z.string(),
          category: z.enum(['books', 'movies']).optional()
        })
      },
      handler: () => []
    });

    const module = defineModule({
      name: 'Search',
      routes: router.build()
    });

    const app = await createApp({ modules: [module] });
    const sdkCode = app && generateSDK(app);

    expect(sdkCode).toContain("q: string; category?: 'books' | 'movies'");
  });
});
