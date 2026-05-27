import fs from 'node:fs';
import path from 'node:path';

export interface I18nOptions {
  defaultLocale: string;
  localesPath?: string;
}

export class I18nService {
  private translations: Record<string, any> = {};
  public defaultLocale: string;

  constructor(options: I18nOptions) {
    this.defaultLocale = options.defaultLocale;
    if (options.localesPath) {
      this.loadTranslationsFromPath(options.localesPath);
    }
  }

  loadTranslationsFromPath(localesPath: string) {
    if (!fs.existsSync(localesPath)) {
      return;
    }

    const files = fs.readdirSync(localesPath);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const locale = path.basename(file, '.json');
        try {
          const content = fs.readFileSync(path.join(localesPath, file), 'utf-8');
          const data = JSON.parse(content);
          this.addTranslations(locale, data);
        } catch (error) {
          // Ignore invalid files
        }
      }
    }
  }

  addTranslations(locale: string, data: Record<string, any>) {
    if (!this.translations[locale]) {
      this.translations[locale] = {};
    }
    this.translations[locale] = { ...this.translations[locale], ...data };
  }

  translate(key: string, locale: string = this.defaultLocale, args: Record<string, any> = {}): string {
    const localeTranslations = this.translations[locale] || this.translations[this.defaultLocale] || {};
    let text = this.getNestedValue(localeTranslations, key) || key;

    for (const [argKey, value] of Object.entries(args)) {
      text = text.replace(new RegExp(`{{${argKey}}}`, 'g'), String(value));
    }

    return text;
  }

  private getNestedValue(obj: any, path: string): string | null {
    if (!obj || !path) return null;
    const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
    return typeof value === 'string' ? value : null;
  }
}
