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
  toKebabCase,
  toPascalCase,
} from './utils.js';

export const generateService = (
  rawFeatureName: string,
  rawName: string,
  options: GenerateResourceOptions = {},
) => {
  const { featureName, featureClass, baseDir } = resolveFeatureContext(
    rawFeatureName,
    options.cwd,
    true,
    generateFeature,
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
