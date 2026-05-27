import pino, { type LoggerOptions } from 'pino';

export const getLoggerOptions = (options: LoggerOptions = {}): LoggerOptions => ({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: ['req.headers.authorization', 'password', 'token'],
    censor: '[REDACTED]',
  },
  ...options,
});

export const createLogger = (options: LoggerOptions = {}) =>
  pino(getLoggerOptions(options));
