import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateFeature } from './feature.js';
import {
  type GenerateMiddlewareOptions,
  ensureFileDoesNotExist,
  resolveFeatureContext,
  toCamelCase,
  toKebabCase,
} from './utils.js';

export const generateMiddleware = (
  rawFeatureName: string,
  rawName: string,
  options: GenerateMiddlewareOptions = {},
) => {
  const { featureName, featureClass, baseDir } = resolveFeatureContext(
    rawFeatureName,
    options.cwd,
    true,
    generateFeature,
  );
  const middlewareName = toKebabCase(rawName);
  const middlewareSlug = toCamelCase(middlewareName);
  const middlewareFile = join(baseDir, `${middlewareName}.middleware.ts`);

  ensureFileDoesNotExist(
    middlewareFile,
    `Middleware "${middlewareName}" already exists in feature "${featureName}"`,
  );

  const content = `import type { RequestContext } from '@eddiecbrl/v12';

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
