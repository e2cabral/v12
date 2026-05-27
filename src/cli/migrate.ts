import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function runMigrate(action: string, name?: string) {
  const pkgPath = join(process.cwd(), 'package.json');
  if (!existsSync(pkgPath)) {
    console.error('❌ package.json not found.');
    return;
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (deps.prisma || existsSync(join(process.cwd(), 'prisma/schema.prisma'))) {
    handlePrisma(action, name);
  } else if (deps['drizzle-kit'] || deps['drizzle-orm']) {
    handleDrizzle(action, name);
  } else if (deps.typeorm) {
    handleTypeORM(action, name);
  } else {
    console.log('ℹ️  No supported ORM detected (Prisma, Drizzle, or TypeORM) in dependencies.');
    console.log('If you are using Mongoose, migrations are typically not used or handled via custom scripts.');
  }
}

function handlePrisma(action: string, name?: string) {
  console.log('✨ Using Prisma Migration Bridge');
  let cmd = 'npx prisma migrate';
  switch (action) {
    case 'dev':
      cmd += ' dev';
      break;
    case 'deploy':
      cmd += ' deploy';
      break;
    case 'status':
      cmd += ' status';
      break;
    case 'create':
      if (!name) {
        console.error('❌ Migration name is required for "create" action.');
        return;
      }
      cmd += ` dev --name ${name} --create-only`;
      break;
    default:
      console.error(`❌ Unknown action for Prisma: ${action}`);
      return;
  }
  execute(cmd);
}

function handleDrizzle(action: string, name?: string) {
  console.log('✨ Using Drizzle Migration Bridge');
  let cmd = 'npx drizzle-kit';
  switch (action) {
    case 'dev':
      cmd += ' push'; // push is common for dev in drizzle
      break;
    case 'deploy':
      cmd += ' migrate';
      break;
    case 'status':
      cmd += ' check';
      break;
    case 'create':
      cmd += ' generate';
      if (name) cmd += ` --name ${name}`;
      break;
    default:
      console.error(`❌ Unknown action for Drizzle: ${action}`);
      return;
  }
  execute(cmd);
}

function handleTypeORM(action: string, name?: string) {
  console.log('✨ Using TypeORM Migration Bridge');
  let cmd = 'npx typeorm-ts-node-commonjs migration:';
  switch (action) {
    case 'dev':
    case 'deploy':
      cmd += 'run';
      break;
    case 'status':
      cmd += 'show';
      break;
    case 'create':
      if (!name) {
        console.error('❌ Migration name is required for "create" action.');
        return;
      }
      cmd += `create ./src/migrations/${name}`;
      break;
    default:
      console.error(`❌ Unknown action for TypeORM: ${action}`);
      return;
  }
  execute(cmd);
}

function execute(cmd: string) {
  console.log(`🚀 Executing: ${cmd}\n`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (error) {
    // Error is already printed by inherit
  }
}
