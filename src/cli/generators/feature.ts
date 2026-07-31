import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import {
  type GenerateFeatureOptions,
  registerModuleInApp,
  toCamelCase,
  toKebabCase,
  toPascalCase,
} from './utils.js';

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
  const baseDir = join(cwd, 'src', 'features', featureName);

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

const buildFeatureTemplate = (
  featureName: string,
  featureSlug: string,
  featureClass: string,
  template: 'standard' | 'minimal',
) => {
  const standardFiles: Record<string, string> = {
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
  [`${featureName}.errors.ts`]: `import { NotFoundError } from '@eddiecbrl/v12';

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
  [`${featureName}.service.ts`]: `import type { EventBus } from '@eddiecbrl/v12';
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
  [`${featureName}.controller.ts`]: `import type { RequestContext } from '@eddiecbrl/v12';
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
  [`${featureName}.routes.ts`]: `import { createRouter } from '@eddiecbrl/v12';
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
  [`${featureName}.module.ts`]: `import { defineModule } from '@eddiecbrl/v12';
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
import { createTestingApp } from '@eddiecbrl/v12';
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

    minimalFiles[`${featureName}.controller.ts`] = `import type { RequestContext } from '@eddiecbrl/v12';
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

    minimalFiles[`${featureName}.module.ts`] = `import { defineModule } from '@eddiecbrl/v12';
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
