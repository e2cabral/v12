import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateFeature } from './feature.js';
import {
  type GenerateResourceOptions,
  appendBeforeEof,
  readExistingFile,
  resolveFeatureContext,
  toCamelCase,
  toKebabCase,
} from './utils.js';

export const generateSchema = (
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
