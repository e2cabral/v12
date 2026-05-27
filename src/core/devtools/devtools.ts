import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AppInstance } from '../http/app.js';

export function registerDevTools(app: AppInstance) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  app.get('/_v12/devtools', async (request, reply) => {
    reply.type('text/html').send(getHtml());
  });

  app.get('/_v12/api/info', async () => {
    return {
      success: true,
      data: {
        version: '0.1.0',
        nodeVersion: process.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        routes: app.printRoutes({ commonPrefix: false }),
        modules: app.modules?.map(m => ({
          name: m.name,
          prefix: m.prefix,
          providers: m.providers?.map(p => typeof p === 'string' ? p : (p as any).provide)
        }))
      }
    };
  });
}

function getHtml() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>V12 DevTools</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #0f172a; color: #f8fafc; }
        .card { background-color: #1e293b; border: 1px solid #334155; }
    </style>
</head>
<body class="p-8">
    <div class="max-w-6xl mx-auto">
        <header class="flex items-center justify-between mb-8">
            <h1 class="text-3xl font-bold text-sky-400">V12 <span class="text-white">DevTools</span></h1>
            <div class="flex gap-4">
                <a href="/_v12/api/info" target="_blank" class="text-sm text-slate-400 hover:text-white">API Raw JSON</a>
                <a href="/docs" target="_blank" class="text-sm text-slate-400 hover:text-white">API Docs</a>
            </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="card p-6 rounded-lg shadow-xl">
                <h3 class="text-slate-400 text-sm font-medium uppercase mb-2">Uptime</h3>
                <p id="uptime" class="text-2xl font-bold">-</p>
            </div>
            <div class="card p-6 rounded-lg shadow-xl">
                <h3 class="text-slate-400 text-sm font-medium uppercase mb-2">Memory Usage</h3>
                <p id="memory" class="text-2xl font-bold">-</p>
            </div>
            <div class="card p-6 rounded-lg shadow-xl">
                <h3 class="text-slate-400 text-sm font-medium uppercase mb-2">Node Version</h3>
                <p id="node-version" class="text-2xl font-bold">${process.version}</p>
            </div>
        </div>

        <div class="grid grid-cols-1 gap-8">
            <section class="card p-6 rounded-lg shadow-xl">
                <h2 class="text-xl font-bold mb-4 border-b border-slate-700 pb-2">Registered Routes</h2>
                <pre id="routes" class="text-sm text-emerald-400 overflow-auto max-h-96"></pre>
            </section>

            <section class="card p-6 rounded-lg shadow-xl">
                <h2 class="text-xl font-bold mb-4 border-b border-slate-700 pb-2">Active Modules</h2>
                <div id="modules" class="space-y-4"></div>
            </section>
        </div>
    </div>

    <script>
        async function loadInfo() {
            try {
                const res = await fetch('/_v12/api/info');
                const { data } = await res.json();
                
                document.getElementById('uptime').textContent = Math.floor(data.uptime) + 's';
                document.getElementById('memory').textContent = Math.round(data.memory.rss / 1024 / 1024) + ' MB';
                document.getElementById('routes').textContent = data.routes;
                
                const modulesHtml = data.modules.map(m => \`
                    <div class="border border-slate-700 p-4 rounded bg-slate-800/50">
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-bold text-sky-400">\${m.name}</h4>
                            <span class="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">\${m.prefix || '/' + m.name}</span>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            \${(m.providers || []).map(p => \`<span class="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300">\${p}</span>\`).join('')}
                        </div>
                    </div>
                \`).join('');
                document.getElementById('modules').innerHTML = modulesHtml || '<p class="text-slate-500">No modules registered.</p>';
            } catch (e) {
                console.error('Failed to load devtools info', e);
            }
        }

        loadInfo();
        setInterval(loadInfo, 5000);
    </script>
</body>
</html>
  `;
}
