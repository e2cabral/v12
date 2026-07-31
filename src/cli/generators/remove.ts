import {
  existsSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import {
  type RemoveCrudResourceOptions,
  type RemoveRouteOptions,
  buildRouteHandlerName,
  removeConstExport,
  removeControllerMethod,
  removeErrorClass,
  removeFileIfExists,
  removeNamedImport,
  removeProviderEntries,
  removeRouteBlock,
  removeTypeAlias,
  resolveFeatureContext,
  toCamelCase,
  toConstantCase,
  toKebabCase,
  toPascalCase,
  unregisterModuleFromApp,
} from './utils.js';

export const removeCrudResource = (
  rawFeatureName: string,
  rawName: string,
  options: RemoveCrudResourceOptions = {},
) => {
  const featureName = toKebabCase(rawFeatureName);
  const resourceName = toKebabCase(rawName);
  const featureContext = resolveFeatureContext(featureName, options.cwd);
  const resourceClass = toPascalCase(resourceName);
  const basePath = options.basePath ?? `/${resourceName}`;
  const controllerPath = join(featureContext.baseDir, `${resourceName}.controller.ts`);
  const servicePath = join(featureContext.baseDir, `${resourceName}.service.ts`);
  const repositoryPath = join(featureContext.baseDir, `${resourceName}.repository.ts`);
  const testPath = join(featureContext.baseDir, `${resourceName}.test.ts`);
  const modulePath = join(featureContext.baseDir, `${featureName}.module.ts`);
  const routesPath = join(featureContext.baseDir, `${featureName}.routes.ts`);
  const schemasPath = join(featureContext.baseDir, `${featureName}.schemas.ts`);
  const typesPath = join(featureContext.baseDir, `${featureName}.types.ts`);
  const errorsPath = join(featureContext.baseDir, `${featureName}.errors.ts`);
  const notFoundErrorClass = `${resourceClass}NotFoundError`;
  const repositoryToken = `${toConstantCase(resourceName)}_REPOSITORY`;

  removeFileIfExists(controllerPath);
  removeFileIfExists(servicePath);
  removeFileIfExists(repositoryPath);
  removeFileIfExists(testPath);

  if (existsSync(modulePath)) {
    let moduleSource = readFileSync(modulePath, 'utf8');
    moduleSource = removeNamedImport(moduleSource, `./${resourceName}.controller.js`, [
      `${resourceClass}Controller`,
    ]);
    moduleSource = removeNamedImport(moduleSource, `./${resourceName}.service.js`, [
      `${resourceClass}Service`,
    ]);
    const adapterClasses = [
      `InMemory${resourceClass}Repository`,
      `Prisma${resourceClass}Repository`,
      `Drizzle${resourceClass}Repository`,
      `TypeOrm${resourceClass}Repository`,
      `Mongoose${resourceClass}Repository`,
      `${resourceClass}RepositoryImpl`,
    ];

    moduleSource = removeNamedImport(moduleSource, `./${resourceName}.repository.js`, [
      repositoryToken,
      ...adapterClasses,
    ]);
    moduleSource = removeProviderEntries(moduleSource, [
      `${resourceClass}Controller`,
      `${resourceClass}Service`,
      ...adapterClasses.map((cls) => `{ provide: ${repositoryToken}, useClass: ${cls} }`),
    ]);
    writeFileSync(modulePath, moduleSource);
  }

  if (existsSync(routesPath)) {
    let routesSource = readFileSync(routesPath, 'utf8');
    routesSource = removeNamedImport(routesSource, `./${resourceName}.controller.js`, [
      `${resourceClass}Controller`,
    ]);
    routesSource = removeNamedImport(routesSource, `./${featureName}.schemas.js`, [
      `list${resourceClass}Schema`,
      `get${resourceClass}Schema`,
      `create${resourceClass}Schema`,
      `update${resourceClass}Schema`,
      `delete${resourceClass}Schema`,
    ]);
    routesSource = removeRouteBlock(routesSource, 'get', basePath);
    routesSource = removeRouteBlock(routesSource, 'get', `${basePath}/:id`);
    routesSource = removeRouteBlock(routesSource, 'post', basePath);
    routesSource = removeRouteBlock(routesSource, 'patch', `${basePath}/:id`);
    routesSource = removeRouteBlock(routesSource, 'delete', `${basePath}/:id`);
    writeFileSync(routesPath, routesSource);
  }

  if (existsSync(schemasPath)) {
    let schemasSource = readFileSync(schemasPath, 'utf8');
    schemasSource = removeConstExport(schemasSource, `list${resourceClass}Schema`);
    schemasSource = removeConstExport(schemasSource, `get${resourceClass}Schema`);
    schemasSource = removeConstExport(schemasSource, `create${resourceClass}Schema`);
    schemasSource = removeConstExport(schemasSource, `update${resourceClass}Schema`);
    schemasSource = removeConstExport(schemasSource, `delete${resourceClass}Schema`);
    writeFileSync(schemasPath, schemasSource);
  }

  if (existsSync(typesPath)) {
    let typesSource = readFileSync(typesPath, 'utf8');
    typesSource = removeTypeAlias(typesSource, resourceClass);
    typesSource = removeTypeAlias(typesSource, `Create${resourceClass}Input`);
    typesSource = removeTypeAlias(typesSource, `Update${resourceClass}Input`);
    writeFileSync(typesPath, typesSource);
  }

  if (existsSync(errorsPath)) {
    let errorsSource = readFileSync(errorsPath, 'utf8');
    errorsSource = removeErrorClass(errorsSource, notFoundErrorClass);
    writeFileSync(errorsPath, errorsSource);
  }

  return {
    featureName,
    resourceName,
    removed: true,
  };
};

export const removeRoute = (
  rawFeatureName: string,
  rawName: string,
  options: RemoveRouteOptions = {},
) => {
  const { featureName, featureClass, baseDir } = resolveFeatureContext(
    rawFeatureName,
    options.cwd,
  );
  const routeName = toKebabCase(rawName);
  const routeSlug = toCamelCase(routeName);
  const method = (options.method ?? 'GET').toLowerCase();
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
  const controllerMethod = buildRouteHandlerName(method.toUpperCase() as RemoveRouteOptions['method'] extends infer T ? NonNullable<T> : never, routeName);

  const routesPath = join(baseDir, `${featureName}.routes.ts`);
  const controllerPath = join(baseDir, `${targetControllerName}.controller.ts`);
  const schemasPath = join(baseDir, `${featureName}.schemas.ts`);

  if (existsSync(routesPath)) {
    let routesSource = readFileSync(routesPath, 'utf8');
    routesSource = removeRouteBlock(routesSource, method, routePath);
    if (!isFeatureController) {
      routesSource = removeNamedImport(routesSource, `./${targetControllerName}.controller.js`, [
        targetControllerClass,
      ]);
    }
    routesSource = removeNamedImport(routesSource, `./${featureName}.schemas.js`, [
      targetSchemaExport,
    ]);
    writeFileSync(routesPath, routesSource);
  }

  if (existsSync(controllerPath)) {
    let controllerSource = readFileSync(controllerPath, 'utf8');
    controllerSource = removeControllerMethod(controllerSource, controllerMethod);
    writeFileSync(controllerPath, controllerSource);
  }

  if (existsSync(schemasPath)) {
    let schemasSource = readFileSync(schemasPath, 'utf8');
    schemasSource = removeConstExport(schemasSource, targetSchemaExport);
    writeFileSync(schemasPath, schemasSource);
  }

  return {
    featureName,
    routeName,
    method: method.toUpperCase(),
    routePath,
    removed: true,
  };
};

export const removeFeature = (rawName: string, options: { cwd?: string } = {}) => {
  const cwd = options.cwd ?? process.cwd();
  const featureName = toKebabCase(rawName);
  const featureClass = toPascalCase(featureName);
  const baseDir = join(cwd, 'src', 'features', featureName);

  if (!existsSync(baseDir)) {
    throw new Error(`Feature "${featureName}" does not exist`);
  }

  rmSync(baseDir, { recursive: true, force: true });

  const appFile = join(cwd, 'src', 'app.ts');
  let unregistered = false;

  if (existsSync(appFile)) {
    const source = readFileSync(appFile, 'utf8');
    const nextSource = unregisterModuleFromApp(source, featureName, featureClass);

    if (nextSource !== source) {
      writeFileSync(appFile, nextSource);
      unregistered = true;
    }
  }

  return {
    featureName,
    unregistered,
  };
};
