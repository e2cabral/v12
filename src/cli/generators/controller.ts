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
  toKebabCase,
  toPascalCase,
} from './utils.js';

export const generateController = (
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
