import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'V12',
  description: 'Framework backend feature-driven para Node.js, TypeScript e Fastify.',
  cleanUrls: true,
  lastUpdated: true,
  lang: 'pt-BR',
  themeConfig: {
    siteTitle: 'V12',
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Introdução', link: '/introduction/' },
      { text: 'Conceitos', link: '/concepts/' },
      { text: 'Arquitetura', link: '/architecture/' },
      { text: 'API', link: '/api/' },
      { text: 'Guias', link: '/guides/' },
      {
        text: 'Versão',
        items: [
          { text: 'v0.1 (current)', link: '/' },
          { text: 'Roadmap', link: '/roadmap/' },
        ],
      },
    ],
    sidebar: [
      {
        text: 'Comece Aqui',
        items: [
          { text: 'Home', link: '/' },
          { text: 'O Que É', link: '/introduction/' },
          { text: 'Filosofia', link: '/introduction/philosophy' },
          { text: 'Instalação', link: '/introduction/installation' },
          { text: 'Quick Start', link: '/introduction/quick-start' },
        ],
      },
      {
        text: 'Conceitos',
        items: [
          { text: 'Visão Geral', link: '/concepts/' },
          { text: 'Containers', link: '/concepts/containers' },
          { text: 'Modules', link: '/concepts/modules' },
          { text: 'Services', link: '/concepts/services' },
          { text: 'Context', link: '/concepts/context' },
          { text: 'Lifecycle', link: '/concepts/lifecycle' },
          { text: 'Configuration', link: '/concepts/configuration' },
          { text: 'Dependency Graph', link: '/concepts/dependency-graph' },
          { text: 'Execution', link: '/concepts/execution' },
        ],
      },
      {
        text: 'Arquitetura',
        items: [
          { text: 'Visão Geral', link: '/architecture/' },
          { text: 'Bootstrap', link: '/architecture/bootstrap' },
          { text: 'Request Pipeline', link: '/architecture/request-pipeline' },
          { text: 'Runtime', link: '/architecture/runtime' },
          { text: 'Extensibilidade', link: '/architecture/extensibility' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Visão Geral', link: '/api/' },
          { text: 'createApp', link: '/api/create-app' },
          { text: 'defineModule', link: '/api/define-module' },
          { text: 'createRouter', link: '/api/create-router' },
          { text: 'Config', link: '/api/config' },
          { text: 'Errors', link: '/api/errors' },
          { text: 'Auth', link: '/api/auth' },
          { text: 'Plugins', link: '/api/plugins' },
          { text: 'Testing', link: '/api/testing' },
          { text: 'CLI', link: '/api/cli' },
        ],
      },
      {
        text: 'Guias',
        items: [
          { text: 'Visão Geral', link: '/guides/' },
          { text: 'Primeira Aplicação', link: '/guides/first-application' },
          { text: 'Autenticação', link: '/guides/authentication' },
          { text: 'Banco de Dados', link: '/guides/database' },
          { text: 'Observabilidade', link: '/guides/observability' },
          { text: 'Testes', link: '/guides/testing' },
          { text: 'Deploy', link: '/guides/deployment' },
          { text: 'Plugins', link: '/guides/plugins' },
        ],
      },
      {
        text: 'Cookbook',
        items: [
          { text: 'Visão Geral', link: '/cookbook/' },
          { text: 'CRUD', link: '/cookbook/crud' },
          { text: 'JWT', link: '/cookbook/jwt-auth' },
          { text: 'Rate Limit', link: '/cookbook/rate-limit' },
          { text: 'Webhooks', link: '/cookbook/webhooks' },
        ],
      },
      {
        text: 'Advanced',
        items: [
          { text: 'Visão Geral', link: '/advanced/' },
          { text: 'Internals', link: '/advanced/internals' },
          { text: 'Lifecycle', link: '/advanced/lifecycle' },
          { text: 'Dependency Injection', link: '/advanced/dependency-injection' },
        ],
      },
      {
        text: 'Operação',
        items: [
          { text: 'Plugins', link: '/plugins/' },
          { text: 'Security', link: '/security/' },
          { text: 'Performance', link: '/performance/' },
          { text: 'Testing', link: '/testing/' },
          { text: 'Deployment', link: '/deployment/' },
          { text: 'Migration', link: '/migration/' },
          { text: 'FAQ', link: '/faq/' },
          { text: 'Glossário', link: '/glossary' },
          { text: 'Roadmap', link: '/roadmap/' },
          { text: 'Contribuição', link: '/contributing/' },
        ],
      },
    ],
    outline: {
      level: [2, 3],
      label: 'Nesta página',
    },
    docFooter: {
      prev: 'Página anterior',
      next: 'Próxima página',
    },
    footer: {
      message: 'Documentação oficial do V12.',
      copyright: 'Copyright © 2026 V12',
    },
    socialLinks: [],
  },
});
