import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ZodTypeAny } from 'zod';
import type { ModuleDefinition } from '../http/module.js';
import { definePlugin } from '../http/plugin.js';
import type { RouteDefinition } from '../http/router.js';

export type OpenApiOptions = {
  title: string;
  version: string;
  description?: string;
  path?: string;
  docsPath?: string;
};

export const pluginOpenApi = (
  modules: ModuleDefinition[],
  options: OpenApiOptions,
) =>
  definePlugin('openapi', (app) => {
    const spec = buildOpenApiDocument(modules, options);
    const path = options.path ?? '/openapi.json';
    const docsPath = options.docsPath ?? '/docs';

    app.get(path, async (_request, reply) => reply.send(spec));
    app.get(docsPath, async (_request, reply) =>
      reply.type('text/html').send(renderDocsPage(path, options.title)),
    );
  });

export const buildOpenApiDocument = (
  modules: ModuleDefinition[],
  options: OpenApiOptions,
) => ({
  openapi: '3.1.0',
  info: {
    title: options.title,
    version: options.version,
    ...(options.description ? { description: options.description } : {}),
  },
  paths: Object.assign(
    {},
    ...modules.map((module) => buildModulePaths(module)),
  ),
});

const buildModulePaths = (module: ModuleDefinition) => {
  const prefix = [module.prefix ?? `/${module.name}`, module.routes?.prefix]
    .filter(Boolean)
    .join('');

  const paths: Record<string, Record<string, unknown>> = {};

  for (const route of module.routes?.routes ?? []) {
    const fullPath = `${prefix}${route.path}`;
    paths[fullPath] ??= {};
    paths[fullPath][route.method.toLowerCase()] = buildOperation(module.name, route);
  }

  return paths;
};

const buildOperation = (moduleName: string, route: RouteDefinition) => ({
  tags: [moduleName],
  operationId: `${route.method.toLowerCase()}${normalizeOperationId(route.path)}`,
  responses: {
    200: {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', const: true },
              data: {},
            },
            required: ['success', 'data'],
          },
        },
      },
    },
  },
  ...(route.schema?.body
    ? {
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: zodToJsonSchema(route.schema.body, {
                target: 'openApi3',
              }),
            },
          },
        },
      }
    : {}),
  ...(route.schema?.params || route.schema?.querystring || route.schema?.headers
    ? {
        parameters: [
          ...schemaPropertiesToParameters(route.schema?.params, 'path'),
          ...schemaPropertiesToParameters(route.schema?.querystring, 'query'),
          ...schemaPropertiesToParameters(route.schema?.headers, 'header'),
        ],
      }
    : {}),
});

const schemaPropertiesToParameters = (
  schema: unknown,
  location: 'path' | 'query' | 'header',
) => {
  if (!schema) {
    return [];
  }

  const jsonSchema = zodToJsonSchema(schema as ZodTypeAny, {
    target: 'openApi3',
  }) as {
    properties?: Record<string, unknown>;
    required?: string[];
  };

  return Object.entries(jsonSchema.properties ?? {}).map(([name, property]) => ({
    name,
    in: location,
    required: jsonSchema.required?.includes(name) ?? false,
    schema: property,
  }));
};

const normalizeOperationId = (path: string) =>
  path
    .replace(/\/+/g, '_')
    .replace(/[:{}-]/g, '')
    .replace(/^_/, '')
    .replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()) || 'Root';

const renderDocsPage = (openApiPath: string, title: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} | API Reference</title>
    <style>
      body { margin: 0; }
    </style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="${openApiPath}"
      data-configuration='{ "theme": "purple" }'></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
