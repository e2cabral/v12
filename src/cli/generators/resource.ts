import {
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { generateController } from './controller.js';
import { generateFeature } from './feature.js';
import { generateRepository } from './repository.js';
import { generateRoute } from './route.js';
import { generateSchema } from './schema.js';
import { generateService } from './service.js';
import {
  type GenerateCrudResourceOptions,
  pluralize,
  readExistingFile,
  resolveFeatureContext,
  toCamelCase,
  toConstantCase,
  toKebabCase,
  toPascalCase,
  upsertConstExport,
  upsertErrorClass,
  upsertTypeAlias,
} from './utils.js';

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

  const featureContext = resolveFeatureContext(featureName, options.cwd, true, generateFeature);
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
    `import type { EventBus } from '@eddiecbrl/v12';
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
    `import type { RequestContext } from '@eddiecbrl/v12';
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
import { createTestingApp } from '@eddiecbrl/v12';
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
