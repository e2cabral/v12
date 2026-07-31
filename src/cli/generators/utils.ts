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

export const escapeForRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const pluralize = (value: string) => (value.endsWith('s') ? `${value}es` : `${value}s`);

export const readExistingFile = (filePath: string, errorMessage: string) => {
  if (!existsSync(filePath)) {
    throw new Error(errorMessage);
  }

  return readFileSync(filePath, 'utf8');
};

export const ensureFileDoesNotExist = (filePath: string, errorMessage: string) => {
  if (existsSync(filePath)) {
    throw new Error(errorMessage);
  }
};

export const removeFileIfExists = (filePath: string) => {
  if (existsSync(filePath)) {
    rmSync(filePath, { force: true });
  }
};

export const appendBeforeEof = (source: string, snippet: string) =>
  source.endsWith('\n') ? `${source}${snippet}` : `${source}\n${snippet}`;

export const insertBeforeLastBrace = (source: string, snippet: string) => {
  const marker = '\n}';
  const index = source.lastIndexOf(marker);

  if (index === -1) {
    return appendBeforeEof(source, snippet);
  }

  return `${source.slice(0, index)}${snippet}${source.slice(index)}`;
};

export const insertBeforeReturn = (source: string, snippet: string) => {
  const marker = '\n  return router.build();';
  const index = source.indexOf(marker);

  if (index === -1) {
    return appendBeforeEof(source, snippet);
  }

  return `${source.slice(0, index)}${snippet}${source.slice(index)}`;
};

export const ensureNamedImport = (
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

export const removeNamedImport = (
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

export const removeProviderEntries = (source: string, providerEntries: string[]) => {
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

export const removeRouteBlock = (source: string, method: string, path: string) =>
  source.replace(
    new RegExp(
      `\\n\\s*router\\.${escapeForRegex(method)}\\('${escapeForRegex(path)}', \\{[\\s\\S]*?\\n\\s*\\}\\);\\n?`,
      'm',
    ),
    '\n',
  );

export const removeControllerMethod = (source: string, methodName: string) =>
  source.replace(
    new RegExp(
      `\\n\\s*${escapeForRegex(methodName)} = async \\([\\s\\S]*?(?=\\n\\s*[a-zA-Z]|\\n\\})`,
      'm',
    ),
    '\n',
  );

export const removeConstExport = (source: string, exportName: string) =>
  source.replace(
    new RegExp(
      `\\n?export const ${escapeForRegex(exportName)} = \\{[\\s\\S]*?\\n\\};\\n?`,
      'm',
    ),
    '\n',
  );

export const removeTypeAlias = (source: string, typeName: string) =>
  source.replace(
    new RegExp(
      `\\n?export type ${escapeForRegex(typeName)} = \\{[\\s\\S]*?\\n\\};\\n?`,
      'm',
    ),
    '\n',
  );

export const removeErrorClass = (source: string, className: string) =>
  source.replace(
    new RegExp(
      `\\n?export class ${escapeForRegex(className)} extends NotFoundError \\{[\\s\\S]*?\\n\\}\\n?`,
      'm',
    ),
    '\n',
  );

export const upsertConstExport = (source: string, exportName: string, block: string) => {
  const pattern = new RegExp(
    `export const ${escapeForRegex(exportName)} = \\{[\\s\\S]*?\\n\\};\\n?`,
    'm',
  );

  if (pattern.test(source)) {
    return source.replace(pattern, `${block}\n`);
  }

  return appendBeforeEof(source, `\n${block}`);
};

export const upsertTypeAlias = (source: string, typeName: string, block: string) => {
  const pattern = new RegExp(
    `export type ${escapeForRegex(typeName)} = \\{[\\s\\S]*?\\n\\};\\n?`,
    'm',
  );

  if (pattern.test(source)) {
    return source.replace(pattern, `${block}\n`);
  }

  return appendBeforeEof(source, `\n${block}`);
};

export const upsertErrorClass = (source: string, className: string, block: string) => {
  const pattern = new RegExp(
    `export class ${escapeForRegex(className)} extends NotFoundError \\{[\\s\\S]*?\\n\\}\\n?`,
    'm',
  );

  if (pattern.test(source)) {
    return source.replace(pattern, `${block}\n`);
  }

  return appendBeforeEof(source, `\n${block}`);
};

export const buildRouteHandlerName = (
  method: GenerateRouteOptions['method'] extends infer T ? NonNullable<T> : never,
  routeName: string,
) => `${method.toLowerCase()}${toPascalCase(routeName)}`;

export const registerModuleInApp = (
  source: string,
  featureName: string,
  featureClass: string,
) => {
  const importLine = `import { ${featureClass}Module } from './features/${featureName}/${featureName}.module.js';`;

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
  const importLine = `import { ${featureClass}Module } from './features/${featureName}/${featureName}.module.js';`;

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

export const resolveFeatureContext = (
  rawFeatureName: string,
  cwd = process.cwd(),
  autoCreate = false,
  generateFeatureFn?: (rawName: string, options: { cwd?: string }) => any,
) => {
  const featureName = toKebabCase(rawFeatureName);
  const featureSlug = toCamelCase(featureName);
  const featureClass = toPascalCase(featureName);
  const baseDir = join(cwd, 'src', 'features', featureName);

  if (!existsSync(baseDir)) {
    if (autoCreate && generateFeatureFn) {
      generateFeatureFn(rawFeatureName, { cwd });
    } else if (autoCreate) {
      throw new Error(`Feature "${featureName}" does not exist and no generator provided`);
    } else {
      throw new Error(`Feature "${featureName}" does not exist`);
    }
  }

  return { featureName, featureSlug, featureClass, baseDir };
};
