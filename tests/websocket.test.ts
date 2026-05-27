import { describe, it, expect } from 'vitest';
import { createApp } from '../src/core/http/app.js';
import { defineModule } from '../src/core/http/module.js';
import { createRouter } from '../src/core/http/router.js';
import { WebSocket } from 'ws';

describe('WebSocket Support', () => {
  it('connects to a websocket and receives messages', async () => {
    const router = createRouter();
    
    // @ts-ignore
    router.get('/ws', {
      websocket: true,
      handler: (context) => {
        const { connection } = context;
        const socket = connection.socket || connection;
        socket.on('message', (message: any) => {
          socket.send(`echo: ${message}`);
        });
      },
    });

    const module = defineModule({
      name: 'WsModule',
      prefix: '',
      routes: router.build(),
    });

    const app = await createApp({
      modules: [module],
      websocket: true,
    });

    await app.listen({ port: 0 });
    const address = app.server.address() as any;
    const port = address.port;

    const ws = new WebSocket(`ws://localhost:${port}/ws`);

    const promise = new Promise((resolve) => {
      ws.on('open', () => {
        ws.send('hello');
      });
      ws.on('message', (data) => {
        resolve(data.toString());
      });
    });

    const response = await promise;
    expect(response).toBe('echo: hello');

    ws.close();
    await app.close();
  });
});
