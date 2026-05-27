import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Container } from '../container/container.js';
import type { RequestContext } from './router.js';
import type { I18nService } from '../i18n/i18n.js';

export function createRequestContext(
  request: FastifyRequest,
  reply: FastifyReply,
  container: Container,
  i18nService: I18nService,
  connection?: any,
): RequestContext {
  const requestContainer = container.createChild();
  const requestLocale =
    (request.query as any)?.lang ||
    request.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
    i18nService.defaultLocale;

  return {
    request,
    reply,
    container: requestContainer,
    connection,
    t: (key: string, args?: Record<string, any>) =>
      i18nService.translate(key, requestLocale as string, args),
  };
}
