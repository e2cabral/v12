import {
  existsSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { generateController } from './controller.js';
import { generateFeature } from './feature.js';
import { generateSchema } from './schema.js';
import {
  type GenerateRouteOptions,
  buildRouteHandlerName,
  ensureNamedImport,
  insertBeforeLastBrace,
  insertBeforeReturn,
  readExistingFile,
  resolveFeatureContext,
  toCamelCase,
  toKebabCase,
  toPascalCase,
} from './utils.js';

export const generateRoute = (
  rawFeatureName: string,
  rawName: string,
  options: GenerateRouteOptions = {},
) => {
  const { featureName, featureClass, baseDir } = resolveFeatureContext(
    rawFeatureName,
    options.cwd,
    true,
    generateFeature,
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
