import { createApp } from './core/http/app.js';

export { createApp } from './core/http/app.js';
export { defineModule } from './core/http/module.js';
export { createRouter } from './core/http/router.js';

export const buildApp = () =>
  createApp({
    modules: [],
  });
