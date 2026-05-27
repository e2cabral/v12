import type { AppInstance } from './app.js';

export type V12Plugin = {
  name: string;
  register: (app: AppInstance) => Promise<void> | void;
};

export const definePlugin = (
  name: string,
  register: V12Plugin['register'],
): V12Plugin => ({
  name,
  register,
});
