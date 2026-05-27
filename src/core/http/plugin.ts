import type { AppInstance } from './app.js';

export type V12Plugin = {
  name: string;
  register: (app: AppInstance) => Promise<void> | void;
  onInit?: (app: AppInstance) => Promise<void> | void;
  onReady?: (app: AppInstance) => Promise<void> | void;
  onClose?: (app: AppInstance) => Promise<void> | void;
  configSchema?: any;
};

export const definePlugin = (
  nameOrPlugin: string | V12Plugin | (V12Plugin['register'] & { name?: string }),
  registerOrName?: V12Plugin['register'] | string,
): V12Plugin => {
  if (typeof nameOrPlugin === 'string') {
    return {
      name: nameOrPlugin,
      register: registerOrName as V12Plugin['register'],
    };
  }

  if (typeof nameOrPlugin === 'function') {
    return {
      name: (registerOrName as string) || nameOrPlugin.name || 'anonymous-plugin',
      register: nameOrPlugin,
    };
  }

  return nameOrPlugin;
};
