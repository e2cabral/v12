import type { AppInstance } from './app.js';
import type { V12Plugin } from './plugin.js';
import { AppError } from '../errors/app-error.js';

/**
 * Manages the registration and lifecycle of V12 plugins.
 */
export class PluginRegistry {
  private plugins: V12Plugin[] = [];

  constructor(private app: AppInstance) {}

  /**
   * Registers a plugin and triggers its onInit hook.
   */
  async register(plugin: V12Plugin, config?: any) {
    // 1. Validate Config if schema exists
    if (plugin.configSchema && config) {
      try {
        if (typeof plugin.configSchema.parse === 'function') {
          plugin.configSchema.parse(config);
        }
      } catch (error: any) {
        throw new AppError(`Plugin "${plugin.name}" configuration validation failed`, {
          code: 'PLUGIN_CONFIG_INVALID',
          details: error.errors || error.message,
          statusCode: 400,
        });
      }
    }

    // Avoid duplicate registration
    if (this.plugins.find((p) => p.name === plugin.name)) {
      this.app.log.warn(`Plugin "${plugin.name}" is already registered. Skipping.`);
      return;
    }

    this.plugins.push(plugin);
    
    // 2. Lifecycle: onInit
    if (plugin.onInit) {
      this.app.log.debug(`Initializing plugin: ${plugin.name}`);
      await plugin.onInit(this.app);
    }

    // 3. Register the plugin core (Fastify integration, etc.)
    await plugin.register(this.app);

    // 4. Register onClose hook if provided
    if (plugin.onClose) {
      this.app.addHook('onClose', async () => {
        this.app.log.debug(`Closing plugin: ${plugin.name}`);
        await plugin.onClose!(this.app);
      });
    }

    this.app.log.info(`Plugin registered: ${plugin.name}`);
  }

  /**
   * Triggers the onReady hook for all registered plugins.
   * Should be called when the application is ready and listening.
   */
  async triggerReady() {
    for (const plugin of this.plugins) {
      if (plugin.onReady) {
        this.app.log.debug(`Plugin ready: ${plugin.name}`);
        await plugin.onReady(this.app);
      }
    }
  }

  getPlugins() {
    return [...this.plugins];
  }
}
