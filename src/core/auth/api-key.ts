import { timingSafeEqual } from 'node:crypto';
import { UnauthorizedError } from '../errors/app-error.js';

export type ApiKeyOptions = {
  key: string;
  headerName?: string;
};

export const verifyApiKey = (
  headers: Record<string, string | string[] | undefined>,
  options: ApiKeyOptions,
) => {
  const headerName = options.headerName?.toLowerCase() ?? 'x-api-key';
  const candidate = headers[headerName];

  if (typeof candidate !== 'string') {
    throw new UnauthorizedError('Invalid API key');
  }

  const expected = Buffer.from(options.key);
  const received = Buffer.from(candidate);

  if (expected.length !== received.length) {
    throw new UnauthorizedError('Invalid API key');
  }

  if (!timingSafeEqual(expected, received)) {
    throw new UnauthorizedError('Invalid API key');
  }

  return true;
};
