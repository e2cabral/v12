import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateFeature } from './feature.js';
import {
  type GenerateGuardOptions,
  ensureFileDoesNotExist,
  resolveFeatureContext,
  toCamelCase,
  toKebabCase,
} from './utils.js';

export const generateGuard = (
  rawFeatureName: string,
  rawName: string,
  options: GenerateGuardOptions = {},
) => {
  const { featureName, featureClass, baseDir } = resolveFeatureContext(
    rawFeatureName,
    options.cwd,
    true,
    generateFeature,
  );
  const guardName = toKebabCase(rawName);
  const guardSlug = toCamelCase(guardName);
  const guardFile = join(baseDir, `${guardName}.guard.ts`);

  ensureFileDoesNotExist(
    guardFile,
    `Guard "${guardName}" already exists in feature "${featureName}"`,
  );

  const content = `import { ForbiddenError, type RouteMiddleware } from '@eddiecbrl/v12';

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
