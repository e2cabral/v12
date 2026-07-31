import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { generateFeature } from './feature.js';
import {
  type GenerateResourceOptions,
  ensureFileDoesNotExist,
  registerProviderInModule,
  resolveFeatureContext,
  toCamelCase,
  toConstantCase,
  toKebabCase,
  toPascalCase,
} from './utils.js';

export const generateRepository = (
  rawFeatureName: string,
  rawName: string,
  options: GenerateResourceOptions = {},
) => {
  const { featureName, baseDir } = resolveFeatureContext(
    rawFeatureName,
    options.cwd,
    true,
    generateFeature,
  );
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
