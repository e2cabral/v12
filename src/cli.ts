#!/usr/bin/env node
import { Command } from 'commander';
import {
  generateController,
  generateCrudResource,
  generateFeature,
  generateRepository,
  generateRoute,
  generateSchema,
  generateService,
  generateMiddleware,
  generateGuard,
  generateMail,
  initProject,
  removeCrudResource,
  removeFeature,
  removeRoute,
} from './cli/scaffold.js';
import { runMigrate } from './cli/migrate.js';
import { generateSDK } from './core/sdk/generator.js';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

const program = new Command();

const v12Banner = `
             ╭────────────────────────────╮
        ╭────┤ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ├────╮
        │    ╰────────────────────────────╯    │
        │   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
        │   ║   HIGH PERFORMANCE ENGINE   ║   │
        ╰────┬────┬────┬────┬────┬────┬────╯
             │    │    │    │    │    │
            ═╧════╧════╧════╧════╧════╧═


        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                ⚙️  V12 FRAMEWORK
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              Fast • Minimal • Modular
                 Feature-Driven Core
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

program.addHelpText('before', v12Banner);

const generate = program.command('generate').description('Generate project resources');
const remove = program.command('remove').description('Remove generated project resources');

program.name('v12').description('V12 feature-driven backend CLI');

program
  .command('init')
  .description('Initialize a new V12 project with basic structure')
  .action(() => {
    const results = initProject();
    console.log('V12 Project Initialization:');
    results.forEach((res) => {
      const status = res.status === 'created' ? '✅ Created' : 'ℹ️  Already exists';
      console.log(`${status}: ${res.path}`);
    });
    console.log('\nProject ready! Run "npm run dev" to start.');
  });

generate
  .command('resource')
  .argument('<feature>', 'feature name')
  .argument('<name>', 'resource name')
  .option('--path <path>', 'base path for the generated CRUD routes')
  .option('--no-register', 'do not register generated providers in the feature module')
  .option('--adapter <adapter>', 'repository adapter: memory, prisma, drizzle, typeorm, mongoose, base', 'memory')
  .action(
    (
      feature: string,
      name: string,
      options: {
        path?: string;
        register: boolean;
        adapter: 'memory' | 'prisma' | 'drizzle' | 'typeorm' | 'mongoose' | 'base';
      },
    ) => {
      const result = generateCrudResource(feature, name, {
        basePath: options.path,
        register: options.register,
        adapter: options.adapter,
      });
      console.log(
        `v12 resource ${result.resourceName} created for feature ${result.featureName} at ${result.basePath}`,
      );
    },
  );

remove
  .command('resource')
  .argument('<feature>', 'feature name')
  .argument('<name>', 'resource name')
  .option('--path <path>', 'base path used by the generated CRUD routes')
  .action((feature: string, name: string, options: { path?: string }) => {
    const result = removeCrudResource(feature, name, {
      basePath: options.path,
    });
    console.log(`v12 resource ${result.resourceName} removed from feature ${result.featureName}`);
  });

remove
  .command('feature')
  .argument('<name>', 'feature name')
  .action((name: string) => {
    const result = removeFeature(name);
    console.log(`v12 feature ${result.featureName} removed`);
    if (result.unregistered) {
      console.log('module unregistered from src/app.ts');
    }
  });

remove
  .command('route')
  .argument('<feature>', 'feature name')
  .argument('<name>', 'route name')
  .option('--method <method>', 'http method', 'GET')
  .option('--path <path>', 'route path')
  .option('--controller <controller>', 'dedicated controller used by the route')
  .option('--schema <schema>', 'named schema export used by the route')
  .action(
    (
      feature: string,
      name: string,
      options: {
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        path?: string;
        controller?: string;
        schema?: string;
      },
    ) => {
      const result = removeRoute(feature, name, {
        method: options.method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
        path: options.path,
        controller: options.controller,
        schema: options.schema,
      });
      console.log(`v12 route ${result.method} ${result.routePath} removed from ${result.featureName}`);
    },
  );

generate
  .command('feature')
  .argument('<name>', 'feature name')
  .option('--template <template>', 'feature template: standard or minimal', 'standard')
  .option('--no-register', 'do not register the generated module in src/app.ts')
  .action((name: string, options: { register: boolean; template: 'standard' | 'minimal' }) => {
    const result = generateFeature(name, {
      register: options.register,
      template: options.template,
    });
    console.log(`v12 feature created at ${result.baseDir}`);
    if (result.registered) {
      console.log('module registered in src/app.ts');
    }
  });

generate
  .command('controller')
  .argument('<feature>', 'feature name')
  .argument('<name>', 'controller name')
  .option('--no-register', 'do not register the generated controller in the feature module')
  .action((feature: string, name: string, options: { register: boolean }) => {
    const result = generateController(feature, name, {
      register: options.register,
    });
    console.log(`v12 controller created at ${result.filePath}`);
    if (result.registered) {
      console.log('controller registered in feature module');
    }
  });

generate
  .command('service')
  .argument('<feature>', 'feature name')
  .argument('<name>', 'service name')
  .option('--no-register', 'do not register the generated service in the feature module')
  .action((feature: string, name: string, options: { register: boolean }) => {
    const result = generateService(feature, name, {
      register: options.register,
    });
    console.log(`v12 service created at ${result.filePath}`);
    if (result.registered) {
      console.log('service registered in feature module');
    }
  });

generate
  .command('repository')
  .argument('<feature>', 'feature name')
  .argument('<name>', 'repository name')
  .option('--no-register', 'do not register the generated repository in the feature module')
  .option('--adapter <adapter>', 'repository adapter: memory, prisma, drizzle, typeorm, mongoose, base', 'memory')
  .action((feature: string, name: string, options: { register: boolean; adapter: 'memory' | 'prisma' | 'drizzle' | 'typeorm' | 'mongoose' | 'base' }) => {
    const result = generateRepository(feature, name, {
      register: options.register,
      adapter: options.adapter,
    });
    console.log(`v12 repository created at ${result.filePath}`);
    if (result.registered) {
      console.log('repository registered in feature module');
    }
  });

generate
  .command('schema')
  .argument('<feature>', 'feature name')
  .argument('<name>', 'schema name')
  .action((feature: string, name: string) => {
    const result = generateSchema(feature, name);
    console.log(`v12 schema ${result.exportName} added to ${result.filePath}`);
  });

generate
  .command('route')
  .argument('<feature>', 'feature name')
  .argument('<name>', 'route name')
  .option('--method <method>', 'http method', 'GET')
  .option('--path <path>', 'route path')
  .option('--controller <controller>', 'dedicated controller for the route')
  .option('--schema <schema>', 'named schema export to use or create')
  .action(
    (
      feature: string,
      name: string,
      options: {
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        path?: string;
        controller?: string;
        schema?: string;
      },
    ) => {
      const result = generateRoute(feature, name, {
        method: options.method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
        path: options.path,
        controller: options.controller,
        schema: options.schema,
      });
      console.log(`v12 route ${result.method} ${result.routePath} added to ${result.featureName}`);
    },
  );

generate
  .command('middleware')
  .argument('<feature>', 'feature name')
  .argument('<name>', 'middleware name')
  .action((feature: string, name: string) => {
    const result = generateMiddleware(feature, name);
    console.log(`v12 middleware created at ${result.middlewareFile}`);
  });

generate
  .command('guard')
  .argument('<feature>', 'feature name')
  .argument('<name>', 'guard name')
  .action((feature: string, name: string) => {
    const result = generateGuard(feature, name);
    console.log(`v12 guard created at ${result.guardFile}`);
  });

generate
  .command('mail')
  .argument('<feature>', 'feature name')
  .argument('<name>', 'mail name')
  .action((feature: string, name: string) => {
    const result = generateMail(feature, name);
    console.log(`v12 mail created at ${result.mailFile}`);
  });

program
  .command('sdk')
  .description('Generate TypeScript SDK from application routes')
  .option('--output <path>', 'output file path', './sdk.ts')
  .option('--url <url>', 'base URL for the API', 'http://localhost:3000')
  .action(async (options: { output: string; url: string }) => {
    try {
      const appPath = join(process.cwd(), 'src/app.ts');
      // Importa dinamicamente o app do projeto
      // Nota: No Windows, caminhos absolutos para import() podem precisar de prefixo file://
      const appUrl = `file://${appPath.replace(/\\/g, '/')}`;
      const { buildApp } = await import(appUrl);
      if (!buildApp) {
        throw new Error('Could not find buildApp export in src/app.ts');
      }

      const app = await buildApp();
      const sdkCode = generateSDK(app, { baseUrl: options.url });

      const outputPath = join(process.cwd(), options.output);
      writeFileSync(outputPath, sdkCode);

      console.log(`✅ SDK generated successfully at ${options.output}`);
    } catch (error: any) {
      console.error(`❌ Error generating SDK: ${error.message}`);
    }
  });

program
  .command('migrate')
  .description('Run database migrations (auto-detects Prisma, Drizzle, or TypeORM)')
  .argument('[action]', 'migration action: dev, deploy, create, status', 'dev')
  .argument('[name]', 'migration name (only for create)')
  .action((action: string, name?: string) => {
    runMigrate(action, name);
  });

program.parse();
