import type { AppInstance } from '../http/app.js';

export interface SDKGeneratorOptions {
  baseUrl?: string;
  output?: string;
}

/**
 * Converts a Zod schema into a TypeScript type string representation.
 * Supports: string, number, boolean, object, array, optional, nullable,
 * enum, union, discriminatedUnion, literal, record, tuple, lazy, default, effects.
 */
function zodToTs(schema: any): string {
  if (!schema) return 'any';
  const type = schema._def?.typeName;
  switch (type) {
    case 'ZodString':
      return 'string';
    case 'ZodNumber':
      return 'number';
    case 'ZodBoolean':
      return 'boolean';
    case 'ZodObject': {
      const shape = schema._def.shape();
      const props = Object.entries(shape)
        .map(([key, value]: [string, any]) => {
          const isOptional = value._def.typeName === 'ZodOptional';
          return `${key}${isOptional ? '?' : ''}: ${zodToTs(value)}`;
        })
        .join('; ');
      return `{ ${props} }`;
    }
    case 'ZodArray':
      return `${zodToTs(schema._def.type)}[]`;
    case 'ZodOptional':
      return zodToTs(schema._def.innerType);
    case 'ZodNullable':
      return `${zodToTs(schema._def.innerType)} | null`;
    case 'ZodEnum':
      return schema._def.values.map((v: any) => `'${v}'`).join(' | ');
    case 'ZodUnion':
      return (schema._def.options as any[])
        .map((opt: any) => zodToTs(opt))
        .join(' | ');
    case 'ZodDiscriminatedUnion':
      return (schema._def.options as any[])
        .map((opt: any) => zodToTs(opt))
        .join(' | ');
    case 'ZodLiteral': {
      const value = schema._def.value;
      if (typeof value === 'string') return `'${value}'`;
      return String(value);
    }
    case 'ZodRecord': {
      const valueType = zodToTs(schema._def.valueType);
      return `Record<string, ${valueType}>`;
    }
    case 'ZodTuple': {
      const items = (schema._def.items as any[])
        .map((item: any) => zodToTs(item))
        .join(', ');
      return `[${items}]`;
    }
    case 'ZodLazy':
      return 'any';
    case 'ZodDefault':
      return zodToTs(schema._def.innerType);
    case 'ZodEffects':
      return zodToTs(schema._def.schema);
    default:
      return 'any';
  }
}

/**
 * Generates a descriptive method name based on HTTP method and route path.
 *
 * Examples:
 * - GET /          → list
 * - POST /         → create
 * - GET /:id       → getById
 * - PUT /:id       → update
 * - DELETE /:id    → remove
 * - POST /export-report → exportReport
 * - GET /search    → search
 * - GET /:id/comments  → getComments
 * - POST /:id/comments → createComment
 */
function generateMethodName(method: string, path: string): string {
  const httpMethod = method.toUpperCase();

  // Normalize path: remove leading/trailing slashes
  const normalizedPath = path.replace(/^\/+|\/+$/g, '');

  // If path is empty or just "/" → use method-based default
  if (!normalizedPath) {
    switch (httpMethod) {
      case 'GET': return 'list';
      case 'POST': return 'create';
      case 'PUT': return 'update';
      case 'PATCH': return 'patch';
      case 'DELETE': return 'remove';
      default: return httpMethod.toLowerCase();
    }
  }

  const segments = normalizedPath.split('/');
  const isParamSegment = (s: string) => s.startsWith(':');

  // Filter out param segments for naming, but track if they exist
  const nonParamSegments = segments.filter(s => !isParamSegment(s));
  const hasParams = segments.some(isParamSegment);
  const endsWithParam = segments.length > 0 && isParamSegment(segments[segments.length - 1]);

  // Convert segments to camelCase
  const toCamelCase = (parts: string[]): string => {
    return parts
      .map((part, idx) => {
        // Handle kebab-case within segments
        const words = part.split('-');
        if (idx === 0) {
          return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
        }
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      })
      .join('');
  };

  // If path is only params (e.g., /:id)
  if (nonParamSegments.length === 0) {
    switch (httpMethod) {
      case 'GET': return 'getById';
      case 'POST': return 'create';
      case 'PUT': return 'update';
      case 'PATCH': return 'patch';
      case 'DELETE': return 'remove';
      default: return httpMethod.toLowerCase();
    }
  }

  // If ends with a param and has non-param segments before (e.g., /comments/:commentId)
  if (endsWithParam && nonParamSegments.length > 0) {
    const baseName = toCamelCase(nonParamSegments);
    switch (httpMethod) {
      case 'GET': return `get${baseName.charAt(0).toUpperCase() + baseName.slice(1)}`;
      case 'POST': return `create${baseName.charAt(0).toUpperCase() + baseName.slice(1)}`;
      case 'PUT': return `update${baseName.charAt(0).toUpperCase() + baseName.slice(1)}`;
      case 'PATCH': return `patch${baseName.charAt(0).toUpperCase() + baseName.slice(1)}`;
      case 'DELETE': return `remove${baseName.charAt(0).toUpperCase() + baseName.slice(1)}`;
      default: return baseName;
    }
  }

  // Path with non-param segments at the end (e.g., /export-report, /search, /:id/comments)
  const baseName = toCamelCase(nonParamSegments);

  if (httpMethod === 'GET') {
    if (hasParams) {
      return `get${baseName.charAt(0).toUpperCase() + baseName.slice(1)}`;
    }
    return baseName;
  }

  if (httpMethod === 'POST') {
    if (hasParams) {
      return `create${baseName.charAt(0).toUpperCase() + baseName.slice(1)}`;
    }
    return baseName;
  }

  if (hasParams) {
    const prefix = httpMethod === 'PUT' ? 'update' : httpMethod === 'PATCH' ? 'patch' : httpMethod === 'DELETE' ? 'remove' : httpMethod.toLowerCase();
    return `${prefix}${baseName.charAt(0).toUpperCase() + baseName.slice(1)}`;
  }

  return baseName;
}

/**
 * Legacy method name generation for backward compatibility.
 * Produces names like `login_post`, `search_get`, etc.
 */
function generateLegacyMethodName(method: string, path: string): string {
  const methodName = path === '/' || path === ''
    ? method.toLowerCase()
    : path.replace(/\//g, '_').replace(/:/g, '').replace(/^_/, '').toLowerCase() + '_' + method.toLowerCase();

  return methodName.replace(/[^a-zA-Z0-9_]/g, '');
}

export function generateSDK(app: AppInstance, options: SDKGeneratorOptions = {}) {
  const { modules } = app;
  const baseUrl = options.baseUrl || 'http://localhost:3000';

  let code = `/**
 * V12 SDK - Autogenerated
 * Generated at: ${new Date().toISOString()}
 * Do not edit manually.
 */

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: any;
}

export class V12Client {
  constructor(private baseUrl: string = '${baseUrl}') {}

  private async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    let url = \`\${this.baseUrl}\${path}\`;
    
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url = url.replace(\`:\${key}\`, String(value));
      }
    }

    if (options.query) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) searchParams.append(key, String(value));
      }
      const qs = searchParams.toString();
      if (qs) url += \`?\${qs}\`;
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Request failed');
    }

    return result.data;
  }

`;

  for (const module of modules) {
    const moduleName = module.name.toLowerCase();
    code += `  public readonly ${moduleName} = {\n`;

    const prefix = [module.prefix ?? `/${module.name}`, module.routes?.prefix]
      .filter(Boolean)
      .join('');

    for (const route of module.routes?.routes ?? []) {
      const descriptiveName = generateMethodName(route.method, route.path);
      const legacyName = generateLegacyMethodName(route.method, route.path);
      const fullPath = `${prefix}${route.path}`;

      const bodyType = zodToTs(route.schema?.body);
      const queryType = zodToTs(route.schema?.querystring);
      const paramsType = zodToTs(route.schema?.params);
      const responseType = zodToTs(route.schema?.response);

      const optionsType = `{
      body${bodyType === 'any' ? '?' : ''}: ${bodyType};
      query${queryType === 'any' ? '?' : ''}: ${queryType};
      params${paramsType === 'any' ? '?' : ''}: ${paramsType};
      headers?: Record<string, string>;
    }`;

      const defaultValue = bodyType === 'any' && queryType === 'any' && paramsType === 'any' ? ' = {}' : '';
      const requestCall = `this.request<${responseType}>('${route.method}', '${fullPath}', options)`;

      // Emit the descriptive method name
      code += `    /**
     * ${route.method} ${fullPath}
     */
    ${descriptiveName}: (options: ${optionsType}${defaultValue}) => ${requestCall},\n`;

      // Emit legacy alias if different from descriptive name
      if (legacyName !== descriptiveName) {
        code += `    /** @alias ${descriptiveName} */\n`;
        code += `    ${legacyName}: (options: ${optionsType}${defaultValue}) => ${requestCall},\n`;
      }

      code += `\n`;
    }

    code += `  };\n\n`;
  }

  code += `}\n`;

  return code;
}
