import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateFeature } from './feature.js';
import {
  ensureFileDoesNotExist,
  resolveFeatureContext,
  toKebabCase,
  toPascalCase,
} from './utils.js';

export const generateMail = (
  rawFeatureName: string,
  rawName: string,
  options: { cwd?: string } = {},
) => {
  const { featureName, featureClass, baseDir } = resolveFeatureContext(
    rawFeatureName,
    options.cwd,
    true,
    generateFeature,
  );
  const mailName = toKebabCase(rawName);
  const mailClass = toPascalCase(mailName);
  const mailFile = join(baseDir, `${mailName}.mail.ts`);

  ensureFileDoesNotExist(
    mailFile,
    `Mail "${mailName}" already exists in feature "${featureName}"`,
  );

  const content = `import { Mailable, type MailMessage } from '@eddiecbrl/v12';

export class ${mailClass}Mail extends Mailable {
  constructor(private readonly data: any) {
    super();
  }

  async build(): Promise<MailMessage> {
    return {
      to: this.data.email,
      subject: 'Welcome to v12',
      html: \`<h1>Hello \${this.data.name}</h1>\`,
    };
  }
}
`;

  writeFileSync(mailFile, content);

  return {
    featureName,
    mailName,
    mailFile,
  };
};
