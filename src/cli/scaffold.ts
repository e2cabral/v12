import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

export type GenerateFeatureOptions = {
  cwd?: string;
  register?: boolean;
  template?: 'standard' | 'minimal';
};

export type GenerateResourceOptions = {
  cwd?: string;
  register?: boolean;
  adapter?: 'memory' | 'prisma' | 'drizzle' | 'typeorm' | 'mongoose' | 'base';
};

export type GenerateRouteOptions = {
  cwd?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path?: string;
  controller?: string;
  schema?: string;
  register?: boolean;
};

export type GenerateCrudResourceOptions = {
  cwd?: string;
  register?: boolean;
  basePath?: string;
  adapter?: 'memory' | 'prisma' | 'drizzle' | 'typeorm' | 'mongoose' | 'base';
};

export type RemoveCrudResourceOptions = {
  cwd?: string;
  basePath?: string;
};

export type RemoveRouteOptions = {
  cwd?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path?: string;
  controller?: string;
  schema?: string;
};

export type GenerateMiddlewareOptions = {
  cwd?: string;
  register?: boolean;
};

export type GenerateGuardOptions = {
  cwd?: string;
  register?: boolean;
};

export const generateFeature = (
  rawName: string,
  options: GenerateFeatureOptions = {},
) => {
  const cwd = options.cwd ?? process.cwd();
  const register = options.register ?? true;
  const template = options.template ?? 'standard';
  const featureName = toKebabCase(rawName);
  const featureSlug = toCamelCase(featureName);
  const featureClass = toPascalCase(featureName);
  const baseDir = join(cwd, 'features', featureName);

  if (existsSync(baseDir)) {
    throw new Error(`Feature "${featureName}" already exists`);
  }

  mkdirSync(baseDir, { recursive: true });

  const files = buildFeatureTemplate(featureName, featureSlug, featureClass, template);
  for (const [file, content] of Object.entries(files)) {
    writeFileSync(join(baseDir, file), content, { flag: 'wx' });
  }

  const appFile = join(cwd, 'src', 'app.ts');
  let registered = false;

  if (register && existsSync(appFile)) {
    const source = readFileSync(appFile, 'utf8');
    const nextSource = registerModuleInApp(source, featureName, featureClass);

    if (nextSource !== source) {
      writeFileSync(appFile, nextSource);
      registered = true;
    }
  }

  return {
    featureName,
    baseDir,
    registered,
    template,
  };
};

export const generateService = (
  rawFeatureName: string,
  rawName: string,
  options: GenerateResourceOptions = {},
) => {
  const { featureName, featureClass, baseDir } = resolveFeatureContext(
    rawFeatureName,
    options.cwd,
  );
  const register = options.register ?? true;
  const resourceName = toKebabCase(rawName);
  const resourceClass = `${toPascalCase(resourceName)}Service`;
  const filePath = join(baseDir, `${resourceName}.service.ts`);
  const modulePath = join(baseDir, `${featureName}.module.ts`);

  ensureFileDoesNotExist(filePath, `Service "${resourceName}" already exists`);

  writeFileSync(
    filePath,
    `export class ${resourceClass}Service {
  async execute(input: { feature: '${featureName}' }) {
    return {
      message: '${resourceClass}Service executed',
      feature: input.feature,
      owner: '${featureClass}',
    };
  }
}
`,
    { flag: 'wx' },
  );

  let registered = false;
  if (register && existsSync(modulePath)) {
    const currentModule = readFileSync(modulePath, 'utf8');
    const nextModule = registerProviderInModule(
      currentModule,
      `./${resourceName}.service.js`,
      [resourceClass],
      [resourceClass],
    );

    if (nextModule !== currentModule) {
      writeFileSync(modulePath, nextModule);
      registered = true;
    }
  }

  return { filePath, featureName, resourceName, registered };
};

export const generateRepository = (
  rawFeatureName: string,
  rawName: string,
  options: GenerateResourceOptions = {},
) => {
  const { featureName, baseDir } = resolveFeatureContext(rawFeatureName, options.cwd);
  const register = options.register ?? true;
  const adapter = options.adapter ?? 'memory';
  const resourceName = toKebabCase(rawName);
  const resourceClass = toPascalCase(resourceName);
  const token = `${toConstantCase(resourceName)}_REPOSITORY`;
  
  let repositoryClass = `InMemory${resourceClass}Repository`;
  let content = '';

  if (adapter === 'prisma') {
    repositoryClass = `Prisma${resourceClass}Repository`;
    content = `import { PrismaRepository } from '../../core/database/prisma.js';

export const ${token} = '${resourceClass}Repository';

export interface ${resourceClass}Repository<TItem = any> {
  findAll(): Promise<TItem[]>;
  findById(id: string): Promise<TItem | null>;
}

export class ${repositoryClass} extends PrismaRepository 
  implements ${resourceClass}Repository 
{
  async findAll() {
    return this.client.${toCamelCase(resourceName)}.findMany();
  }

  async findById(id: string) {
    return this.client.${toCamelCase(resourceName)}.findUnique({ where: { id } });
  }
}
`;
  } else if (adapter === 'drizzle') {
    repositoryClass = `Drizzle${resourceClass}Repository`;
    content = `import { DrizzleRepository } from '../../core/database/drizzle.js';

export const ${token} = '${resourceClass}Repository';

export interface ${resourceClass}Repository<TItem = any> {
  findAll(): Promise<TItem[]>;
  findById(id: string): Promise<TItem | null>;
}

export class ${repositoryClass} extends DrizzleRepository 
  implements ${resourceClass}Repository 
{
  async findAll() {
    return this.db.select().from(this.table);
  }

  async findById(id: string) {
    // Implementacao especifica do drizzle
    return null;
  }
}
`;
  } else if (adapter === 'typeorm') {
    repositoryClass = `TypeOrm${resourceClass}Repository`;
    content = `import { TypeOrmRepository } from '../../core/database/typeorm.js';

export const ${token} = '${resourceClass}Repository';

export interface ${resourceClass}Repository<TItem = any> {
  findAll(): Promise<TItem[]>;
  findById(id: string): Promise<TItem | null>;
}

export class ${repositoryClass} extends TypeOrmRepository 
  implements ${resourceClass}Repository 
{
  async findAll() {
    return this.repository.find();
  }

  async findById(id: string) {
    return this.repository.findOne({ where: { id } });
  }
}
`;
  } else if (adapter === 'mongoose') {
    repositoryClass = `Mongoose${resourceClass}Repository`;
    content = `import { MongooseRepository } from '../../core/database/mongoose.js';

export const ${token} = '${resourceClass}Repository';

export interface ${resourceClass}Repository<TItem = any> {
  findAll(): Promise<TItem[]>;
  findById(id: string): Promise<TItem | null>;
}

export class ${repositoryClass} extends MongooseRepository 
  implements ${resourceClass}Repository 
{
  async findAll() {
    return this.model.find().lean();
  }

  async findById(id: string) {
    return this.model.findById(id).lean();
  }
}
`;
  } else if (adapter === 'base') {
    repositoryClass = `${resourceClass}RepositoryImpl`;
    content = `import { Repository } from '../../core/database/repository.js';

export const ${token} = '${resourceClass}Repository';

export interface ${resourceClass}Repository<TItem = any> {
  findAll(): Promise<TItem[]>;
  findById(id: string): Promise<TItem | null>;
}

export class ${repositoryClass} extends Repository 
  implements ${resourceClass}Repository 
{
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return null;
  }
}
`;
  } else {
    content = `export const ${token} = '${resourceClass}Repository';

export interface ${resourceClass}Repository<TItem = unknown> {
  findAll(): Promise<TItem[]>;
  findById(id: string): Promise<TItem | null>;
}

export class ${repositoryClass}<TItem extends { id: string }>
  implements ${resourceClass}Repository<TItem>
{
  private readonly items = new Map<string, TItem>();

  async findAll() {
    return [...this.items.values()];
  }

  async findById(id: string) {
    return this.items.get(id) ?? null;
  }
}
`;
  }

  const filePath = join(baseDir, `${resourceName}.repository.ts`);
  const modulePath = join(baseDir, `${featureName}.module.ts`);

  ensureFileDoesNotExist(filePath, `Repository "${resourceName}" already exists`);

  writeFileSync(filePath, content, { flag: 'wx' });

  let registered = false;
  if (register && existsSync(modulePath)) {
    const currentModule = readFileSync(modulePath, 'utf8');
    const nextModule = registerProviderInModule(
      currentModule,
      `./${resourceName}.repository.js`,
      [token, repositoryClass],
      [`{ provide: ${token}, useClass: ${repositoryClass} }`],
    );

    if (nextModule !== currentModule) {
      writeFileSync(modulePath, nextModule);
      registered = true;
    }
  }

  return { filePath, featureName: toKebabCase(rawFeatureName), resourceName, registered };
};

export const generateController = (
  rawFeatureName: string,
  rawName: string,
  options: GenerateResourceOptions = {},
) => {
  const { featureName, baseDir } = resolveFeatureContext(rawFeatureName, options.cwd);
  const register = options.register ?? true;
  const resourceName = toKebabCase(rawName);
  const resourceClass = `${toPascalCase(resourceName)}Controller`;
  const filePath = join(baseDir, `${resourceName}.controller.ts`);
  const modulePath = join(baseDir, `${featureName}.module.ts`);

  ensureFileDoesNotExist(filePath, `Controller "${resourceName}" already exists`);

  writeFileSync(
    filePath,
    `export class ${resourceClass} {
  async handle() {
    return {
      controller: '${resourceName}',
      feature: '${featureName}',
    };
  }
}
`,
    { flag: 'wx' },
  );

  let registered = false;
  if (register && existsSync(modulePath)) {
    const currentModule = readFileSync(modulePath, 'utf8');
    const nextModule = registerProviderInModule(
      currentModule,
      `./${resourceName}.controller.js`,
      [resourceClass],
      [resourceClass],
    );

    if (nextModule !== currentModule) {
      writeFileSync(modulePath, nextModule);
      registered = true;
    }
  }

  return { filePath, featureName, resourceName, registered };
};

export const generateSchema = (
  rawFeatureName: string,
  rawName: string,
  options: GenerateResourceOptions = {},
) => {
  const { featureName, baseDir } = resolveFeatureContext(rawFeatureName, options.cwd);
  const schemaName = toCamelCase(rawName);
  const schemasPath = join(baseDir, `${featureName}.schemas.ts`);
  const currentSchemas = readExistingFile(
    schemasPath,
    `Feature schemas file not found for "${featureName}"`,
  );

  const exportName = `${schemaName}Schema`;
  if (currentSchemas.includes(`export const ${exportName} =`)) {
    throw new Error(`Schema "${schemaName}" already exists in feature "${featureName}"`);
  }

  const nextSchemas = appendBeforeEof(
    currentSchemas,
    `
export const ${exportName} = {
  body: z.object({
    name: z.string().min(2),
  }),
};
`,
  );

  writeFileSync(schemasPath, nextSchemas);

  return {
    featureName,
    schemaName,
    exportName,
    filePath: schemasPath,
  };
};

export const generateRoute = (
  rawFeatureName: string,
  rawName: string,
  options: GenerateRouteOptions = {},
) => {
  const { featureName, featureClass, baseDir } = resolveFeatureContext(
    rawFeatureName,
    options.cwd,
  );
  const register = options.register ?? true;
  const routeName = toKebabCase(rawName);
  const routeSlug = toCamelCase(routeName);
  const method = options.method ?? 'GET';
  const routePath = options.path ?? `/${routeName}`;
  const targetControllerName = options.controller
    ? toKebabCase(options.controller)
    : featureName;
  const targetSchemaName = options.schema
    ? toCamelCase(options.schema)
    : `${routeSlug}Route`;
  const targetSchemaExport = `${targetSchemaName}Schema`;
  const isFeatureController = targetControllerName === featureName;
  const targetControllerClass = isFeatureController
    ? `${featureClass}Controller`
    : `${toPascalCase(targetControllerName)}Controller`;

  const routesPath = join(baseDir, `${featureName}.routes.ts`);
  const controllerPath = join(baseDir, `${targetControllerName}.controller.ts`);
  const schemasPath = join(baseDir, `${featureName}.schemas.ts`);

  if (!isFeatureController && !existsSync(controllerPath)) {
    generateController(rawFeatureName, targetControllerName, {
      cwd: options.cwd,
      register,
    });
  }

  const currentSchemas = readExistingFile(
    schemasPath,
    `Feature schemas file not found for "${featureName}"`,
  );
  if (!currentSchemas.includes(`export const ${targetSchemaExport} =`)) {
    generateSchema(rawFeatureName, targetSchemaName, {
      cwd: options.cwd,
    });
  }

  const currentRoutes = readExistingFile(
    routesPath,
    `Feature routes file not found for "${featureName}"`,
  );
  const currentController = readExistingFile(
    controllerPath,
    `Feature controller file not found for "${targetControllerName}"`,
  );

  const controllerMethod = buildRouteHandlerName(method, routeName);

  if (
    currentRoutes.includes(`router.${method.toLowerCase()}('${routePath}'`) ||
    currentController.includes(`${controllerMethod} = async`)
  ) {
    throw new Error(`Route "${routeName}" already exists in feature "${featureName}"`);
  }

  const nextController = insertBeforeLastBrace(
    currentController,
    `
  ${controllerMethod} = async () => ({
    feature: '${featureName}',
    route: '${routeName}',
    method: '${method}',
  });
`,
  );

  let nextRoutesSource = currentRoutes;
  nextRoutesSource = ensureNamedImport(
    nextRoutesSource,
    `./${featureName}.schemas.js`,
    targetSchemaExport,
  );
  if (!isFeatureController) {
    nextRoutesSource = ensureNamedImport(
      nextRoutesSource,
      `./${targetControllerName}.controller.js`,
      targetControllerClass,
    );
  }

  const nextRoutes = insertBeforeReturn(
    nextRoutesSource,
    `
  router.${method.toLowerCase()}('${routePath}', {
    schema: ${targetSchemaExport},
    handler: ({ container }) =>
      container.resolve(${targetControllerClass}).${controllerMethod}(),
  });
`,
  );

  writeFileSync(controllerPath, nextController);
  writeFileSync(routesPath, nextRoutes);

  return {
    featureName,
    routeName,
    method,
    routePath,
    controllerName: targetControllerName,
    schemaName: targetSchemaExport,
  };
};

export const generateCrudResource = (
  rawFeatureName: string,
  rawName: string,
  options: GenerateCrudResourceOptions = {},
) => {
  const featureName = toKebabCase(rawFeatureName);
  const resourceName = toKebabCase(rawName);
  const register = options.register ?? true;
  const basePath = options.basePath ?? `/${resourceName}`;
  const resourceClass = toPascalCase(resourceName);
  const resourcePlural = pluralize(resourceClass);
  const resourceSlug = toCamelCase(resourceName);

  const controller = generateController(featureName, resourceName, {
    cwd: options.cwd,
    register,
  });
  const service = generateService(featureName, resourceName, {
    cwd: options.cwd,
    register,
  });
  const repository = generateRepository(featureName, resourceName, {
    cwd: options.cwd,
    register,
    adapter: options.adapter,
  });
  const schemas = [
    generateSchema(featureName, `list-${resourceName}`, { cwd: options.cwd }),
    generateSchema(featureName, `get-${resourceName}`, { cwd: options.cwd }),
    generateSchema(featureName, `create-${resourceName}`, { cwd: options.cwd }),
    generateSchema(featureName, `update-${resourceName}`, { cwd: options.cwd }),
    generateSchema(featureName, `delete-${resourceName}`, { cwd: options.cwd }),
  ];
  const routes = [
    generateRoute(featureName, `list-${resourceName}`, {
      cwd: options.cwd,
      register,
      method: 'GET',
      path: basePath,
      controller: resourceName,
      schema: `list-${resourceName}`,
    }),
    generateRoute(featureName, `get-${resourceName}`, {
      cwd: options.cwd,
      register,
      method: 'GET',
      path: `${basePath}/:id`,
      controller: resourceName,
      schema: `get-${resourceName}`,
    }),
    generateRoute(featureName, `create-${resourceName}`, {
      cwd: options.cwd,
      register,
      method: 'POST',
      path: basePath,
      controller: resourceName,
      schema: `create-${resourceName}`,
    }),
    generateRoute(featureName, `update-${resourceName}`, {
      cwd: options.cwd,
      register,
      method: 'PATCH',
      path: `${basePath}/:id`,
      controller: resourceName,
      schema: `update-${resourceName}`,
    }),
    generateRoute(featureName, `delete-${resourceName}`, {
      cwd: options.cwd,
      register,
      method: 'DELETE',
      path: `${basePath}/:id`,
      controller: resourceName,
      schema: `delete-${resourceName}`,
    }),
  ];

  const featureContext = resolveFeatureContext(featureName, options.cwd);
  const typesPath = join(featureContext.baseDir, `${featureName}.types.ts`);
  const schemasPath = join(featureContext.baseDir, `${featureName}.schemas.ts`);
  const errorsPath = join(featureContext.baseDir, `${featureName}.errors.ts`);
  const testPath = join(featureContext.baseDir, `${resourceName}.test.ts`);
  const notFoundErrorClass = `${resourceClass}NotFoundError`;

  writeFileSync(
    typesPath,
    upsertTypeAlias(
      upsertTypeAlias(
        upsertTypeAlias(
          readExistingFile(typesPath, `Feature types file not found for "${featureName}"`),
          resourceClass,
          `export type ${resourceClass} = {
  id: string;
  name: string;
};
`,
        ),
        `Create${resourceClass}Input`,
        `export type Create${resourceClass}Input = {
  name: string;
};
`,
      ),
      `Update${resourceClass}Input`,
      `export type Update${resourceClass}Input = {
  name?: string;
};
`,
    ),
  );

  writeFileSync(
    errorsPath,
    upsertErrorClass(
      readExistingFile(errorsPath, `Feature errors file not found for "${featureName}"`),
      notFoundErrorClass,
      `export class ${notFoundErrorClass} extends NotFoundError {
  constructor() {
    super('${resourceClass} not found', '${toConstantCase(resourceName)}_NOT_FOUND');
  }
}
`,
    ),
  );

  writeFileSync(
    repository.filePath,
    `import { randomUUID } from 'node:crypto';
import type {
  ${resourceClass},
  Create${resourceClass}Input,
  Update${resourceClass}Input,
} from './${featureName}.types.js';

export const ${toConstantCase(resourceName)}_REPOSITORY = '${resourceClass}Repository';

export interface ${resourceClass}Repository {
  findAll(): Promise<${resourceClass}[]>;
  findById(id: string): Promise<${resourceClass} | null>;
  create(data: Create${resourceClass}Input): Promise<${resourceClass}>;
  update(id: string, data: Update${resourceClass}Input): Promise<${resourceClass} | null>;
  delete(id: string): Promise<boolean>;
}

export class InMemory${resourceClass}Repository implements ${resourceClass}Repository {
  private readonly items = new Map<string, ${resourceClass}>();

  async findAll() {
    return [...this.items.values()];
  }

  async findById(id: string) {
    return this.items.get(id) ?? null;
  }

  async create(data: Create${resourceClass}Input) {
    const item = {
      id: randomUUID(),
      ...data,
    };

    this.items.set(item.id, item);
    return item;
  }

  async update(id: string, data: Update${resourceClass}Input) {
    const current = this.items.get(id);
    if (!current) {
      return null;
    }

    const next = {
      ...current,
      ...data,
    };

    this.items.set(id, next);
    return next;
  }

  async delete(id: string) {
    return this.items.delete(id);
  }
}
`,
  );

  writeFileSync(
    service.filePath,
    `import type { EventBus } from '../../core/events/event-bus.js';
import { ${notFoundErrorClass} } from './${featureName}.errors.js';
import type {
  Create${resourceClass}Input,
  Update${resourceClass}Input,
} from './${featureName}.types.js';
import {
  ${toConstantCase(resourceName)}_REPOSITORY,
  type ${resourceClass}Repository,
} from './${resourceName}.repository.js';

export class ${resourceClass}Service {
  static inject = [${toConstantCase(resourceName)}_REPOSITORY, 'EventBus'] as const;

  constructor(
    private readonly repository: ${resourceClass}Repository,
    private readonly events: EventBus,
  ) {}

  async list${resourcePlural}() {
    return this.repository.findAll();
  }

  async get${resourceClass}(id: string) {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new ${notFoundErrorClass}();
    }

    return item;
  }

  async create${resourceClass}(input: Create${resourceClass}Input) {
    const item = await this.repository.create(input);
    this.events.emit('${resourceName}.created', item);
    return item;
  }

  async update${resourceClass}(id: string, input: Update${resourceClass}Input) {
    const item = await this.repository.update(id, input);
    if (!item) {
      throw new ${notFoundErrorClass}();
    }

    this.events.emit('${resourceName}.updated', item);
    return item;
  }

  async delete${resourceClass}(id: string) {
    const removed = await this.repository.delete(id);
    if (!removed) {
      throw new ${notFoundErrorClass}();
    }

    this.events.emit('${resourceName}.deleted', { id });
    return {
      id,
      deleted: true,
    };
  }
}
`,
  );

  writeFileSync(
    controller.filePath,
    `import type { RequestContext } from '../../core/http/router.js';
import { ${resourceClass}Service } from './${resourceName}.service.js';

export class ${resourceClass}Controller {
  static inject = [${resourceClass}Service] as const;

  constructor(private readonly service: ${resourceClass}Service) {}

  getList${resourceClass} = async () => this.service.list${resourcePlural}();

  getGet${resourceClass} = async ({ request }: RequestContext) =>
    this.service.get${resourceClass}((request.params as { id: string }).id);

  postCreate${resourceClass} = async ({ request }: RequestContext) =>
    this.service.create${resourceClass}(request.body as { name: string });

  patchUpdate${resourceClass} = async ({ request }: RequestContext) =>
    this.service.update${resourceClass}(
      (request.params as { id: string }).id,
      request.body as { name?: string },
    );

  deleteDelete${resourceClass} = async ({ request }: RequestContext) =>
    this.service.delete${resourceClass}((request.params as { id: string }).id);
}
`,
  );

  let nextSchemas = readExistingFile(
    schemasPath,
    `Feature schemas file not found for "${featureName}"`,
  );
  nextSchemas = upsertConstExport(
    nextSchemas,
    `list${resourceClass}Schema`,
    `export const list${resourceClass}Schema = {
  querystring: z.object({
    search: z.string().optional(),
  }),
};
`,
  );
  nextSchemas = upsertConstExport(
    nextSchemas,
    `get${resourceClass}Schema`,
    `export const get${resourceClass}Schema = {
  params: z.object({
    id: z.string().min(1),
  }),
};
`,
  );
  nextSchemas = upsertConstExport(
    nextSchemas,
    `create${resourceClass}Schema`,
    `export const create${resourceClass}Schema = {
  body: z.object({
    name: z.string().min(2),
  }),
};
`,
  );
  nextSchemas = upsertConstExport(
    nextSchemas,
    `update${resourceClass}Schema`,
    `export const update${resourceClass}Schema = {
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
  }),
};
`,
  );
  nextSchemas = upsertConstExport(
    nextSchemas,
    `delete${resourceClass}Schema`,
    `export const delete${resourceClass}Schema = {
  params: z.object({
    id: z.string().min(1),
  }),
};
`,
  );
  writeFileSync(schemasPath, nextSchemas);

  writeFileSync(
    testPath,
    `import { describe, expect, it } from 'vitest';
import { createTestingApp } from '../../core/testing/testing-app.js';
import { ${toPascalCase(featureName)}Module } from './${featureName}.module.js';

describe('${resourceName} resource', () => {
  it('supports full crud flow', async () => {
    const app = await createTestingApp({
      modules: [${toPascalCase(featureName)}Module],
    });

    const listBeforeResponse = await app.inject({
      method: 'GET',
      url: '${basePath}',
    });

    expect(listBeforeResponse.statusCode).toBe(200);
    expect(listBeforeResponse.json()).toMatchObject({
      success: true,
      data: [],
    });

    const createResponse = await app.inject({
      method: 'POST',
      url: '${basePath}',
      payload: {
        name: '${resourceClass} example',
      },
    });

    expect(createResponse.statusCode).toBe(200);
    const created = createResponse.json().data;

    const getResponse = await app.inject({
      method: 'GET',
      url: '${basePath}/' + created.id,
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toMatchObject({
      success: true,
      data: {
        id: created.id,
        name: '${resourceClass} example',
      },
    });

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: '${basePath}/' + created.id,
      payload: {
        name: '${resourceClass} updated',
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      success: true,
      data: {
        id: created.id,
        name: '${resourceClass} updated',
      },
    });

    const listAfterResponse = await app.inject({
      method: 'GET',
      url: '${basePath}',
    });

    expect(listAfterResponse.statusCode).toBe(200);
    expect(listAfterResponse.json()).toMatchObject({
      success: true,
      data: [
        {
          id: created.id,
          name: '${resourceClass} updated',
        },
      ],
    });

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: '${basePath}/' + created.id,
    });

    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.json()).toMatchObject({
      success: true,
      data: {
        id: created.id,
        deleted: true,
      },
    });
  });
});
`,
  );

  return {
    featureName,
    resourceName,
    basePath,
    controller,
    service,
    repository,
    schemas,
    routes,
    testPath,
  };
};

export const removeCrudResource = (
  rawFeatureName: string,
  rawName: string,
  options: RemoveCrudResourceOptions = {},
) => {
  const featureName = toKebabCase(rawFeatureName);
  const resourceName = toKebabCase(rawName);
  const featureContext = resolveFeatureContext(featureName, options.cwd);
  const resourceClass = toPascalCase(resourceName);
  const basePath = options.basePath ?? `/${resourceName}`;
  const controllerPath = join(featureContext.baseDir, `${resourceName}.controller.ts`);
  const servicePath = join(featureContext.baseDir, `${resourceName}.service.ts`);
  const repositoryPath = join(featureContext.baseDir, `${resourceName}.repository.ts`);
  const testPath = join(featureContext.baseDir, `${resourceName}.test.ts`);
  const modulePath = join(featureContext.baseDir, `${featureName}.module.ts`);
  const routesPath = join(featureContext.baseDir, `${featureName}.routes.ts`);
  const schemasPath = join(featureContext.baseDir, `${featureName}.schemas.ts`);
  const typesPath = join(featureContext.baseDir, `${featureName}.types.ts`);
  const errorsPath = join(featureContext.baseDir, `${featureName}.errors.ts`);
  const notFoundErrorClass = `${resourceClass}NotFoundError`;
  const repositoryToken = `${toConstantCase(resourceName)}_REPOSITORY`;

  removeFileIfExists(controllerPath);
  removeFileIfExists(servicePath);
  removeFileIfExists(repositoryPath);
  removeFileIfExists(testPath);

  if (existsSync(modulePath)) {
    let moduleSource = readFileSync(modulePath, 'utf8');
    moduleSource = removeNamedImport(moduleSource, `./${resourceName}.controller.js`, [
      `${resourceClass}Controller`,
    ]);
    moduleSource = removeNamedImport(moduleSource, `./${resourceName}.service.js`, [
      `${resourceClass}Service`,
    ]);
    const adapterClasses = [
      `InMemory${resourceClass}Repository`,
      `Prisma${resourceClass}Repository`,
      `Drizzle${resourceClass}Repository`,
      `TypeOrm${resourceClass}Repository`,
      `Mongoose${resourceClass}Repository`,
      `${resourceClass}RepositoryImpl`,
    ];

    moduleSource = removeNamedImport(moduleSource, `./${resourceName}.repository.js`, [
      repositoryToken,
      ...adapterClasses,
    ]);
    moduleSource = removeProviderEntries(moduleSource, [
      `${resourceClass}Controller`,
      `${resourceClass}Service`,
      ...adapterClasses.map((cls) => `{ provide: ${repositoryToken}, useClass: ${cls} }`),
    ]);
    writeFileSync(modulePath, moduleSource);
  }

  if (existsSync(routesPath)) {
    let routesSource = readFileSync(routesPath, 'utf8');
    routesSource = removeNamedImport(routesSource, `./${resourceName}.controller.js`, [
      `${resourceClass}Controller`,
    ]);
    routesSource = removeNamedImport(routesSource, `./${featureName}.schemas.js`, [
      `list${resourceClass}Schema`,
      `get${resourceClass}Schema`,
      `create${resourceClass}Schema`,
      `update${resourceClass}Schema`,
      `delete${resourceClass}Schema`,
    ]);
    routesSource = removeRouteBlock(routesSource, 'get', basePath);
    routesSource = removeRouteBlock(routesSource, 'get', `${basePath}/:id`);
    routesSource = removeRouteBlock(routesSource, 'post', basePath);
    routesSource = removeRouteBlock(routesSource, 'patch', `${basePath}/:id`);
    routesSource = removeRouteBlock(routesSource, 'delete', `${basePath}/:id`);
    writeFileSync(routesPath, routesSource);
  }

  if (existsSync(schemasPath)) {
    let schemasSource = readFileSync(schemasPath, 'utf8');
    schemasSource = removeConstExport(schemasSource, `list${resourceClass}Schema`);
    schemasSource = removeConstExport(schemasSource, `get${resourceClass}Schema`);
    schemasSource = removeConstExport(schemasSource, `create${resourceClass}Schema`);
    schemasSource = removeConstExport(schemasSource, `update${resourceClass}Schema`);
    schemasSource = removeConstExport(schemasSource, `delete${resourceClass}Schema`);
    writeFileSync(schemasPath, schemasSource);
  }

  if (existsSync(typesPath)) {
    let typesSource = readFileSync(typesPath, 'utf8');
    typesSource = removeTypeAlias(typesSource, resourceClass);
    typesSource = removeTypeAlias(typesSource, `Create${resourceClass}Input`);
    typesSource = removeTypeAlias(typesSource, `Update${resourceClass}Input`);
    writeFileSync(typesPath, typesSource);
  }

  if (existsSync(errorsPath)) {
    let errorsSource = readFileSync(errorsPath, 'utf8');
    errorsSource = removeErrorClass(errorsSource, notFoundErrorClass);
    writeFileSync(errorsPath, errorsSource);
  }

  return {
    featureName,
    resourceName,
    removed: true,
  };
};

export const removeRoute = (
  rawFeatureName: string,
  rawName: string,
  options: RemoveRouteOptions = {},
) => {
  const { featureName, featureClass, baseDir } = resolveFeatureContext(
    rawFeatureName,
    options.cwd,
  );
  const routeName = toKebabCase(rawName);
  const routeSlug = toCamelCase(routeName);
  const method = (options.method ?? 'GET').toLowerCase();
  const routePath = options.path ?? `/${routeName}`;
  const targetControllerName = options.controller
    ? toKebabCase(options.controller)
    : featureName;
  const targetSchemaName = options.schema
    ? toCamelCase(options.schema)
    : `${routeSlug}Route`;
  const targetSchemaExport = `${targetSchemaName}Schema`;
  const isFeatureController = targetControllerName === featureName;
  const targetControllerClass = isFeatureController
    ? `${featureClass}Controller`
    : `${toPascalCase(targetControllerName)}Controller`;
  const controllerMethod = buildRouteHandlerName(method.toUpperCase() as RemoveRouteOptions['method'] extends infer T ? NonNullable<T> : never, routeName);

  const routesPath = join(baseDir, `${featureName}.routes.ts`);
  const controllerPath = join(baseDir, `${targetControllerName}.controller.ts`);
  const schemasPath = join(baseDir, `${featureName}.schemas.ts`);

  if (existsSync(routesPath)) {
    let routesSource = readFileSync(routesPath, 'utf8');
    routesSource = removeRouteBlock(routesSource, method, routePath);
    if (!isFeatureController) {
      routesSource = removeNamedImport(routesSource, `./${targetControllerName}.controller.js`, [
        targetControllerClass,
      ]);
    }
    routesSource = removeNamedImport(routesSource, `./${featureName}.schemas.js`, [
      targetSchemaExport,
    ]);
    writeFileSync(routesPath, routesSource);
  }

  if (existsSync(controllerPath)) {
    let controllerSource = readFileSync(controllerPath, 'utf8');
    controllerSource = removeControllerMethod(controllerSource, controllerMethod);
    writeFileSync(controllerPath, controllerSource);
  }

  if (existsSync(schemasPath)) {
    let schemasSource = readFileSync(schemasPath, 'utf8');
    schemasSource = removeConstExport(schemasSource, targetSchemaExport);
    writeFileSync(schemasPath, schemasSource);
  }

  return {
    featureName,
    routeName,
    method: method.toUpperCase(),
    routePath,
    removed: true,
  };
};

export const removeFeature = (rawName: string, options: { cwd?: string } = {}) => {
  const cwd = options.cwd ?? process.cwd();
  const featureName = toKebabCase(rawName);
  const featureClass = toPascalCase(featureName);
  const baseDir = join(cwd, 'features', featureName);

  if (!existsSync(baseDir)) {
    throw new Error(`Feature "${featureName}" does not exist`);
  }

  rmSync(baseDir, { recursive: true, force: true });

  const appFile = join(cwd, 'src', 'app.ts');
  let unregistered = false;

  if (existsSync(appFile)) {
    const source = readFileSync(appFile, 'utf8');
    const nextSource = unregisterModuleFromApp(source, featureName, featureClass);

    if (nextSource !== source) {
      writeFileSync(appFile, nextSource);
      unregistered = true;
    }
  }

  return {
    featureName,
    unregistered,
  };
};

export const generateMiddleware = (
  rawFeatureName: string,
  rawName: string,
  options: GenerateMiddlewareOptions = {},
) => {
  const { featureName, featureClass, baseDir } = resolveFeatureContext(
    rawFeatureName,
    options.cwd,
  );
  const middlewareName = toKebabCase(rawName);
  const middlewareSlug = toCamelCase(middlewareName);
  const middlewareFile = join(baseDir, `${middlewareName}.middleware.ts`);

  ensureFileDoesNotExist(
    middlewareFile,
    `Middleware "${middlewareName}" already exists in feature "${featureName}"`,
  );

  const content = `import type { RequestContext } from '../../core/http/router.js';

export const ${middlewareSlug}Middleware = async ({ request }: RequestContext) => {
  // Middleware logic here
};
`;

  writeFileSync(middlewareFile, content);

  return {
    featureName,
    middlewareName,
    middlewareFile,
  };
};

export const generateGuard = (
  rawFeatureName: string,
  rawName: string,
  options: GenerateGuardOptions = {},
) => {
  const { featureName, featureClass, baseDir } = resolveFeatureContext(
    rawFeatureName,
    options.cwd,
  );
  const guardName = toKebabCase(rawName);
  const guardSlug = toCamelCase(guardName);
  const guardFile = join(baseDir, `${guardName}.guard.ts`);

  ensureFileDoesNotExist(
    guardFile,
    `Guard "${guardName}" already exists in feature "${featureName}"`,
  );

  const content = `import type { RouteMiddleware } from '../../core/http/router.js';
import { ForbiddenError } from '../../core/errors/app-error.js';

export const ${guardSlug}Guard = (): RouteMiddleware => async ({ request, container }) => {
  // Guard logic here
  const allowed = true;
  
  if (!allowed) {
    throw new ForbiddenError('Access denied');
  }
};
`;

  writeFileSync(guardFile, content);

  return {
    featureName,
    guardName,
    guardFile,
  };
};

export const generateMail = (
  rawFeatureName: string,
  rawName: string,
  options: { cwd?: string } = {},
) => {
  const { featureName, featureClass, baseDir } = resolveFeatureContext(
    rawFeatureName,
    options.cwd,
  );
  const mailName = toKebabCase(rawName);
  const mailClass = toPascalCase(mailName);
  const mailFile = join(baseDir, `${mailName}.mail.ts`);

  ensureFileDoesNotExist(
    mailFile,
    `Mail "${mailName}" already exists in feature "${featureName}"`,
  );

  const content = `import { Mailable } from '../../core/mail/mailable.js';
import type { MailMessage } from '../../core/mail/mail-adapter.js';

export class ${mailClass}Mail extends Mailable {
  constructor(private readonly data: any) {
    super();
  }

  async build(): Promise<MailMessage> {
    return {
      to: this.data.email,
      subject: 'Welcome to v12',
      html: \`<h1>Hello \${this.data.name}</h1>\`,
    };
  }
}
`;

  writeFileSync(mailFile, content);

  return {
    featureName,
    mailName,
    mailFile,
  };
};

export const registerModuleInApp = (
  source: string,
  featureName: string,
  featureClass: string,
) => {
  const importLine = `import { ${featureClass}Module } from '../features/${featureName}/${featureName}.module.js';`;

  let nextSource = source;
  if (!nextSource.includes(importLine)) {
    const lines = nextSource.split('\n');
    const importIndexes = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.startsWith('import '));

    const insertAt =
      importIndexes.length > 0
        ? importIndexes[importIndexes.length - 1]!.index + 1
        : 0;

    lines.splice(insertAt, 0, importLine);
    nextSource = lines.join('\n');
  }

  const modulesMatch = nextSource.match(/modules:\s*\[([\s\S]*?)\]/m);
  if (!modulesMatch) {
    return nextSource;
  }

  const currentModules = modulesMatch[1] ?? '';
  if (currentModules.includes(`${featureClass}Module`)) {
    return nextSource;
  }

  const trimmed = currentModules.trim();
  const replacement = trimmed
    ? `modules: [${trimmed}, ${featureClass}Module]`
    : `modules: [${featureClass}Module]`;

  return nextSource.replace(/modules:\s*\[[\s\S]*?\]/m, replacement);
};

export const unregisterModuleFromApp = (
  source: string,
  featureName: string,
  featureClass: string,
) => {
  const importLine = `import { ${featureClass}Module } from '../features/${featureName}/${featureName}.module.js';`;

  let nextSource = source.replace(importLine, '').replace(/^\s*[\r\n]/gm, '');

  const modulesMatch = nextSource.match(/modules:\s*\[([\s\S]*?)\]/m);
  if (!modulesMatch) {
    return nextSource;
  }

  const currentModules = modulesMatch[1] ?? '';
  const nextModules = currentModules
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m !== `${featureClass}Module` && m !== '')
    .join(', ');

  return nextSource.replace(/modules:\s*\[[\s\S]*?\]/m, `modules: [${nextModules}]`);
};

export const registerProviderInModule = (
  source: string,
  target: string,
  importNames: string[],
  providerEntries: string[],
) => {
  const sanitizedImports = importNames.filter(Boolean);
  const sanitizedProviders = providerEntries.filter(Boolean);
  if (sanitizedImports.length === 0 && sanitizedProviders.length === 0) {
    return source;
  }

  let nextSource = source;
  nextSource = ensureNamedImport(nextSource, target, ...sanitizedImports);

  const providersMatch = nextSource.match(/providers:\s*\[([\s\S]*?)\]/m);
  if (!providersMatch) {
    return nextSource;
  }

  const currentProviders = providersMatch[1] ?? '';
  const missingProviders = sanitizedProviders.filter(
    (providerName) => !currentProviders.includes(providerName),
  );

  if (missingProviders.length === 0) {
    return nextSource;
  }

  const trimmed = currentProviders.trim();
  const separator = trimmed ? ', ' : '';
  const replacement = `providers: [${trimmed}${separator}${missingProviders.join(', ')}]`;

  return nextSource.replace(/providers:\s*\[[\s\S]*?\]/m, replacement);
};

const resolveFeatureContext = (rawFeatureName: string, cwd = process.cwd()) => {
  const featureName = toKebabCase(rawFeatureName);
  const featureSlug = toCamelCase(featureName);
  const featureClass = toPascalCase(featureName);
  const baseDir = join(cwd, 'features', featureName);

  if (!existsSync(baseDir)) {
    throw new Error(`Feature "${featureName}" does not exist`);
  }

  return { featureName, featureSlug, featureClass, baseDir };
};

const readExistingFile = (filePath: string, errorMessage: string) => {
  if (!existsSync(filePath)) {
    throw new Error(errorMessage);
  }

  return readFileSync(filePath, 'utf8');
};

const ensureFileDoesNotExist = (filePath: string, errorMessage: string) => {
  if (existsSync(filePath)) {
    throw new Error(errorMessage);
  }
};

const upsertConstExport = (source: string, exportName: string, block: string) => {
  const pattern = new RegExp(
    `export const ${escapeForRegex(exportName)} = \\{[\\s\\S]*?\\n\\};\\n?`,
    'm',
  );

  if (pattern.test(source)) {
    return source.replace(pattern, `${block}\n`);
  }

  return appendBeforeEof(source, `\n${block}`);
};

const upsertTypeAlias = (source: string, typeName: string, block: string) => {
  const pattern = new RegExp(
    `export type ${escapeForRegex(typeName)} = \\{[\\s\\S]*?\\n\\};\\n?`,
    'm',
  );

  if (pattern.test(source)) {
    return source.replace(pattern, `${block}\n`);
  }

  return appendBeforeEof(source, `\n${block}`);
};

const upsertErrorClass = (source: string, className: string, block: string) => {
  const pattern = new RegExp(
    `export class ${escapeForRegex(className)} extends NotFoundError \\{[\\s\\S]*?\\n\\}\\n?`,
    'm',
  );

  if (pattern.test(source)) {
    return source.replace(pattern, `${block}\n`);
  }

  return appendBeforeEof(source, `\n${block}`);
};

const removeConstExport = (source: string, exportName: string) =>
  source.replace(
    new RegExp(
      `\\n?export const ${escapeForRegex(exportName)} = \\{[\\s\\S]*?\\n\\};\\n?`,
      'm',
    ),
    '\n',
  );

const removeTypeAlias = (source: string, typeName: string) =>
  source.replace(
    new RegExp(
      `\\n?export type ${escapeForRegex(typeName)} = \\{[\\s\\S]*?\\n\\};\\n?`,
      'm',
    ),
    '\n',
  );

const removeErrorClass = (source: string, className: string) =>
  source.replace(
    new RegExp(
      `\\n?export class ${escapeForRegex(className)} extends NotFoundError \\{[\\s\\S]*?\\n\\}\\n?`,
      'm',
    ),
    '\n',
  );

const appendBeforeEof = (source: string, snippet: string) =>
  source.endsWith('\n') ? `${source}${snippet}` : `${source}\n${snippet}`;

const insertBeforeLastBrace = (source: string, snippet: string) => {
  const marker = '\n}';
  const index = source.lastIndexOf(marker);

  if (index === -1) {
    return appendBeforeEof(source, snippet);
  }

  return `${source.slice(0, index)}${snippet}${source.slice(index)}`;
};

const insertBeforeReturn = (source: string, snippet: string) => {
  const marker = '\n  return router.build();';
  const index = source.indexOf(marker);

  if (index === -1) {
    return appendBeforeEof(source, snippet);
  }

  return `${source.slice(0, index)}${snippet}${source.slice(index)}`;
};

const ensureNamedImport = (
  source: string,
  target: string,
  ...importedNames: string[]
) => {
  const namesToAdd = importedNames.filter(Boolean);
  if (namesToAdd.length === 0) {
    return source;
  }

  const importRegex = new RegExp(
    `import\\s*\\{([^}]*)\\}\\s*from\\s*'${escapeForRegex(target)}';`,
    'm',
  );
  const existingImport = source.match(importRegex);

  if (!existingImport) {
    const lines = source.split('\n');
    const lastImportIndex = lines.reduce(
      (lastIndex, line, index) => (line.startsWith('import ') ? index : lastIndex),
      -1,
    );

    lines.splice(
      lastImportIndex + 1,
      0,
      `import { ${namesToAdd.join(', ')} } from '${target}';`,
    );
    return lines.join('\n');
  }

  const currentNames = existingImport[1]
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  const missingNames = namesToAdd.filter((name) => !currentNames.includes(name));

  if (missingNames.length === 0) {
    return source;
  }

  const nextNames = [...currentNames, ...missingNames].sort().join(', ');

  return source.replace(importRegex, `import { ${nextNames} } from '${target}';`);
};

const removeNamedImport = (
  source: string,
  target: string,
  importedNames: string[],
) => {
  const importRegex = new RegExp(
    `import\\s*\\{([^}]*)\\}\\s*from\\s*'${escapeForRegex(target)}';\\n?`,
    'm',
  );
  const existingImport = source.match(importRegex);
  if (!existingImport) {
    return source;
  }

  const currentNames = existingImport[1]
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  const nextNames = currentNames.filter((name) => !importedNames.includes(name));

  if (nextNames.length === 0) {
    return source.replace(importRegex, '');
  }

  return source.replace(importRegex, `import { ${nextNames.join(', ')} } from '${target}';\n`);
};

const removeProviderEntries = (source: string, providerEntries: string[]) => {
  const providersMatch = source.match(/providers:\s*\[([\s\S]*?)\]/m);
  if (!providersMatch) {
    return source;
  }

  let nextProviders = providersMatch[1] ?? '';
  for (const entry of providerEntries) {
    const escaped = escapeForRegex(entry);
    nextProviders = nextProviders
      .replace(new RegExp(`,\\s*${escaped}`, 'g'), '')
      .replace(new RegExp(`${escaped}\\s*,`, 'g'), '')
      .replace(new RegExp(escaped, 'g'), '');
  }

  nextProviders = nextProviders
    .replace(/,\s*,/g, ',')
    .replace(/^\s*,\s*/g, '')
    .replace(/\s*,\s*$/g, '')
    .trim();

  return source.replace(
    /providers:\s*\[[\s\S]*?\]/m,
    `providers: [${nextProviders}]`,
  );
};

const removeRouteBlock = (source: string, method: string, path: string) =>
  source.replace(
    new RegExp(
      `\\n\\s*router\\.${escapeForRegex(method)}\\('${escapeForRegex(path)}', \\{[\\s\\S]*?\\n\\s*\\}\\);\\n?`,
      'm',
    ),
    '\n',
  );

const removeControllerMethod = (source: string, methodName: string) =>
  source.replace(
    new RegExp(
      `\\n\\s*${escapeForRegex(methodName)} = async \\([\\s\\S]*?(?=\\n\\s*[a-zA-Z]|\\n\\})`,
      'm',
    ),
    '\n',
  );

const removeFileIfExists = (filePath: string) => {
  if (existsSync(filePath)) {
    rmSync(filePath, { force: true });
  }
};

const buildRouteHandlerName = (
  method: GenerateRouteOptions['method'] extends infer T ? NonNullable<T> : never,
  routeName: string,
) => `${method.toLowerCase()}${toPascalCase(routeName)}`;

const escapeForRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const pluralize = (value: string) => (value.endsWith('s') ? `${value}es` : `${value}s`);

const buildFeatureTemplate = (
  featureName: string,
  featureSlug: string,
  featureClass: string,
  template: 'standard' | 'minimal',
) => {
  const standardFiles = {
  [`${featureName}.types.ts`]: `export type ${featureClass} = {
  id: string;
  name: string;
};

export type Create${featureClass}Input = {
  name: string;
};
`,
  [`${featureName}.schemas.ts`]: `import { z } from 'zod';

export const create${featureClass}Schema = {
  body: z.object({
    name: z.string().min(2),
  }),
};

export const get${featureClass}Schema = {
  params: z.object({
    id: z.string().min(1),
  }),
};
`,
  [`${featureName}.errors.ts`]: `import { NotFoundError } from '../../src/core/errors/app-error.js';

export class ${featureClass}NotFoundError extends NotFoundError {
  constructor() {
    super('${featureClass} not found', '${featureSlug.toUpperCase()}_NOT_FOUND');
  }
}
`,
  [`${featureName}.repository.ts`]: `import { randomUUID } from 'node:crypto';
import type { Create${featureClass}Input, ${featureClass} } from './${featureName}.types.js';

export const ${featureSlug.toUpperCase()}_REPOSITORY = '${featureClass}Repository';

export interface ${featureClass}Repository {
  findAll(): Promise<${featureClass}[]>;
  findById(id: string): Promise<${featureClass} | null>;
  create(data: Create${featureClass}Input): Promise<${featureClass}>;
}

export class InMemory${featureClass}Repository implements ${featureClass}Repository {
  private readonly items = new Map<string, ${featureClass}>();

  async findAll() {
    return [...this.items.values()];
  }

  async findById(id: string) {
    return this.items.get(id) ?? null;
  }

  async create(data: Create${featureClass}Input) {
    const item = {
      id: randomUUID(),
      ...data,
    };

    this.items.set(item.id, item);
    return item;
  }
}
`,
  [`${featureName}.service.ts`]: `import type { EventBus } from '../../src/core/events/event-bus.js';
import { ${featureClass}NotFoundError } from './${featureName}.errors.js';
import type { Create${featureClass}Input } from './${featureName}.types.js';
import {
  ${featureSlug.toUpperCase()}_REPOSITORY,
  type ${featureClass}Repository,
} from './${featureName}.repository.js';

export class ${featureClass}Service {
  static inject = [${featureSlug.toUpperCase()}_REPOSITORY, 'EventBus'] as const;

  constructor(
    private readonly repository: ${featureClass}Repository,
    private readonly events: EventBus,
  ) {}

  async list${featureClass}s() {
    return this.repository.findAll();
  }

  async get${featureClass}(id: string) {
    const item = await this.repository.findById(id);

    if (!item) {
      throw new ${featureClass}NotFoundError();
    }

    return item;
  }

  async create${featureClass}(input: Create${featureClass}Input) {
    const item = await this.repository.create(input);
    this.events.emit('${featureName}.created', item);
    return item;
  }
}
`,
  [`${featureName}.controller.ts`]: `import type { RequestContext } from '../../src/core/http/router.js';
import { ${featureClass}Service } from './${featureName}.service.js';

export class ${featureClass}Controller {
  static inject = [${featureClass}Service] as const;

  constructor(private readonly service: ${featureClass}Service) {}

  list = async () => this.service.list${featureClass}s();

  get = async ({ request }: RequestContext) =>
    this.service.get${featureClass}((request.params as { id: string }).id);

  create = async ({ request }: RequestContext) =>
    this.service.create${featureClass}(request.body as { name: string });
}
`,
  [`${featureName}.routes.ts`]: `import { createRouter } from '../../src/core/http/router.js';
import { ${featureClass}Controller } from './${featureName}.controller.js';
import { create${featureClass}Schema, get${featureClass}Schema } from './${featureName}.schemas.js';

export const build${featureClass}Routes = () => {
  const router = createRouter();

  router.get('/', {
    handler: ({ container }) => container.resolve(${featureClass}Controller).list(),
  });

  router.get('/:id', {
    schema: get${featureClass}Schema,
    handler: (context) => context.container.resolve(${featureClass}Controller).get(context),
  });

  router.post('/', {
    schema: create${featureClass}Schema,
    handler: (context) => context.container.resolve(${featureClass}Controller).create(context),
  });

  return router.build();
};
`,
  [`${featureName}.module.ts`]: `import { defineModule } from '../../src/core/http/module.js';
import { ${featureClass}Controller } from './${featureName}.controller.js';
import { build${featureClass}Routes } from './${featureName}.routes.js';
import {
  InMemory${featureClass}Repository,
  ${featureSlug.toUpperCase()}_REPOSITORY,
} from './${featureName}.repository.js';
import { ${featureClass}Service } from './${featureName}.service.js';

export const ${featureClass}Module = defineModule({
  name: '${featureName}',
  providers: [
    { provide: ${featureSlug.toUpperCase()}_REPOSITORY, useClass: InMemory${featureClass}Repository },
    ${featureClass}Service,
    ${featureClass}Controller,
  ],
  routes: build${featureClass}Routes(),
});
`,
  [`${featureName}.test.ts`]: `import { describe, expect, it } from 'vitest';
import { createTestingApp } from '../../core/testing/testing-app.js';
import { ${featureClass}Module } from './${featureName}.module.js';

describe('${featureName} feature', () => {
  it('creates ${featureName}', async () => {
    const app = await createTestingApp({
      modules: [${featureClass}Module],
    });

    const response = await app.inject({
      method: 'POST',
      url: '/${featureName}/',
      payload: {
        name: '${featureClass} example',
      },
    });

    expect(response.statusCode).toBe(200);
  });
});
`,
  };

  if (template === 'minimal') {
    const {
      [`${featureName}.errors.ts`]: _errors,
      [`${featureName}.repository.ts`]: _repository,
      [`${featureName}.test.ts`]: _test,
      ...minimalFiles
    } = standardFiles;

    minimalFiles[`${featureName}.service.ts`] = `export class ${featureClass}Service {
  async list${featureClass}s() {
    return [];
  }

  async get${featureClass}(id: string) {
    return {
      id,
      name: '${featureClass}',
    };
  }

  async create${featureClass}(input: { name: string }) {
    return {
      id: 'temp-id',
      ...input,
    };
  }
}
`;

    minimalFiles[`${featureName}.controller.ts`] = `import type { RequestContext } from '../../core/http/router.js';
import { ${featureClass}Service } from './${featureName}.service.js';

export class ${featureClass}Controller {
  static inject = [${featureClass}Service] as const;

  constructor(private readonly service: ${featureClass}Service) {}

  list = async () => this.service.list${featureClass}s();

  get = async ({ request }: RequestContext) =>
    this.service.get${featureClass}((request.params as { id: string }).id);

  create = async ({ request }: RequestContext) =>
    this.service.create${featureClass}(request.body as { name: string });
}
`;

    minimalFiles[`${featureName}.module.ts`] = `import { defineModule } from '../../core/http/module.js';
import { ${featureClass}Controller } from './${featureName}.controller.js';
import { build${featureClass}Routes } from './${featureName}.routes.js';
import { ${featureClass}Service } from './${featureName}.service.js';

export const ${featureClass}Module = defineModule({
  name: '${featureName}',
  providers: [${featureClass}Service, ${featureClass}Controller],
  routes: build${featureClass}Routes(),
});
`;

    return minimalFiles;
  }

  return standardFiles;
};

export const toPascalCase = (value: string) =>
  value
    .split(/[^a-zA-Z0-9]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

export const toCamelCase = (value: string) => {
  const pascal = toPascalCase(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

export const toKebabCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();

export const toConstantCase = (value: string) =>
  toKebabCase(value).replace(/-/g, '_').toUpperCase();

export const initProject = () => {
  const cwd = process.cwd();
  const results: { path: string; status: 'created' | 'exists' }[] = [];

  const files = [
    {
      path: join('src', 'app.ts'),
      content: `import { createApp } from './core/http/app.js';
import { pluginOpenApi } from './core/swagger/openapi.js';

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
