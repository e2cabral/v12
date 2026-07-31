import type { AppInstance } from './app.js';

/**
 * Definição de um plugin V12 com hooks de ciclo de vida.
 *
 * @example
 * ```ts
 * const myPlugin: V12Plugin = {
 *   name: 'my-plugin',
 *   register: async (app) => { app.log.info('Plugin loaded'); },
 * };
 * ```
 */
export type V12Plugin = {
  /** Nome único do plugin. */
  name: string;
  /** Função principal de registro chamada durante bootstrap. */
  register: (app: AppInstance) => Promise<void> | void;
  /** Hook chamado na inicialização (antes de ready). */
  onInit?: (app: AppInstance) => Promise<void> | void;
  /** Hook chamado quando o app está pronto para receber requisições. */
  onReady?: (app: AppInstance) => Promise<void> | void;
  /** Hook chamado durante o encerramento da aplicação. */
  onClose?: (app: AppInstance) => Promise<void> | void;
  /** Schema de validação para configuração do plugin. */
  configSchema?: any;
};

/**
 * Cria um plugin V12 a partir de um nome e função de registro, ou de um objeto completo.
 *
 * @param nameOrPlugin - Nome do plugin, objeto V12Plugin, ou função de registro.
 * @param registerOrName - Função de registro (quando primeiro arg é string) ou nome (quando primeiro arg é função).
 * @returns Um objeto V12Plugin normalizado.
 *
 * @example
 * ```ts
 * const logger = definePlugin('logger', async (app) => {
 *   app.log.info('Logger plugin registered');
 * });
 * ```
 */
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
