import inquirer from 'inquirer';
import { generateCrudResource } from './scaffold.js';

export async function resourceWizard() {
  console.log('\n📦 V12 Resource Generator Wizard\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'feature',
      message: 'Enter the feature name:',
      validate: (input) => (input.trim() ? true : 'Feature name is required'),
    },
    {
      type: 'input',
      name: 'name',
      message: 'Enter the resource name:',
      validate: (input) => (input.trim() ? true : 'Resource name is required'),
    },
    {
      type: 'input',
      name: 'path',
      message: 'Enter the base path (optional, default: /resource-name):',
    },
    {
      type: 'list',
      name: 'adapter',
      message: 'Select the repository adapter:',
      choices: ['memory', 'prisma', 'drizzle', 'typeorm', 'mongoose', 'base'],
      default: 'memory',
    },
    {
      type: 'confirm',
      name: 'register',
      message: 'Register providers in the feature module?',
      default: true,
    },
  ]);

  const result = generateCrudResource(answers.feature, answers.name, {
    basePath: answers.path || undefined,
    register: answers.register,
    adapter: answers.adapter,
  });

  console.log(
    `\n✅ Resource "${result.resourceName}" created for feature "${result.featureName}" at "${result.basePath}"`,
  );
}
