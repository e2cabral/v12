export type AppErrorOptions = {
  statusCode?: number;
  code?: string;
  details?: unknown;
};

/**
 * Erro base da aplicação V12 com código HTTP, código interno e detalhes opcionais.
 *
 * @example
 * ```ts
 * throw new AppError('User not found', {
 *   statusCode: 404,
 *   code: 'USER_NOT_FOUND',
 * });
 * ```
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? 'INTERNAL_SERVER_ERROR';
    this.details = options.details;
  }
}

/**
 * Erro de validação (HTTP 400) com detalhes dos campos inválidos.
 *
 * @example
 * ```ts
 * throw new ValidationError('Invalid input', [
 *   { field: 'email', message: 'must be a valid email' },
 * ]);
 * ```
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, { statusCode: 401, code: 'UNAUTHORIZED' });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, { statusCode: 403, code: 'FORBIDDEN' });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, { statusCode: 404, code });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(message, { statusCode: 409, code });
  }
}
