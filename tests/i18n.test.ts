import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../src/app';
import { createRouter } from '../src/core/http/router';
import { defineModule } from '../src/core/http/module';
import fs from 'node:fs';
import path from 'node:path';

describe('i18n Nativo', () => {
  const localesDir = path.join(process.cwd(), 'test-locales');

  beforeAll(() => {
    if (!fs.existsSync(localesDir)) {
      fs.mkdirSync(localesDir);
    }
    fs.writeFileSync(path.join(localesDir, 'en.json'), JSON.stringify({ welcome: 'Welcome, {{name}}!' }));
    fs.writeFileSync(path.join(localesDir, 'pt.json'), JSON.stringify({ welcome: 'Bem-vindo, {{name}}!' }));
  });

  afterAll(() => {
    fs.rmSync(localesDir, { recursive: true, force: true });
  });

  it('deve traduzir usando arquivos JSON globais', async () => {
    const router = createRouter();
    router.get('/greet', {
      handler: ({ t, request }) => {
        const name = (request.query as any).name || 'Guest';
        return { message: t('welcome', { name }) };
      }
    });

    const module = defineModule({
      name: 'Test',
      routes: router.build()
    });

    const app = await createApp({
      modules: [module],
      i18n: {
        defaultLocale: 'en',
        localesPath: localesDir
      }
    });

    // Teste Default (EN)
    const resEn = await app.inject({
      method: 'GET',
      url: '/Test/greet?name=John'
    });
    expect(resEn.json()).toEqual({ success: true, data: { message: 'Welcome, John!' } });

    // Teste PT via query param
    const resPt = await app.inject({
      method: 'GET',
      url: '/Test/greet?name=John&lang=pt'
    });
    expect(resPt.json()).toEqual({ success: true, data: { message: 'Bem-vindo, John!' } });

    // Teste PT via header
    const resHeader = await app.inject({
      method: 'GET',
      url: '/Test/greet?name=John',
      headers: {
        'accept-language': 'pt-BR'
      }
    });
    expect(resHeader.json()).toEqual({ success: true, data: { message: 'Bem-vindo, John!' } });
  });

  it('deve traduzir usando definições inline nos módulos', async () => {
    const router = createRouter();
    router.get('/hello', {
      handler: ({ t }) => ({ message: t('hello') })
    });

    const module = defineModule({
      name: 'Inline',
      routes: router.build(),
      i18n: {
        en: { hello: 'Hello!' },
        pt: { hello: 'Olá!' }
      }
    });

    const app = await createApp({
      modules: [module],
      i18n: { defaultLocale: 'en' }
    });

    const resPt = await app.inject({
      method: 'GET',
      url: '/Inline/hello?lang=pt'
    });
    expect(resPt.json()).toEqual({ success: true, data: { message: 'Olá!' } });
  });
});
