import { describe, it, expect } from 'vitest';
import { createTestingApp } from '../src/core/testing/testing-app.js';
import { defineModule } from '../src/core/http/module.js';
import { createRouter } from '../src/core/http/router.js';
import FormData from 'form-data';

describe('Multipart Support', () => {
  it('receives a file via multipart', async () => {
    const router = createRouter();
    router.post('/upload', {
      handler: async ({ request }) => {
        const data = await (request as any).file();
        return { filename: data.filename };
      },
    });

    const module = defineModule({
      name: 'UploadModule',
      prefix: '',
      routes: router.build(),
    });

    const app = await createTestingApp({
      modules: [module],
      upload: true,
    });

    const form = new FormData();
    form.append('file', Buffer.from('hello'), 'test.txt');

    const response = await app.inject({
      method: 'POST',
      url: '/upload',
      payload: form.getBuffer(),
      headers: form.getHeaders(),
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.filename).toBe('test.txt');
  });
});
