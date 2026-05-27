import type { FastifyReply } from 'fastify';

export type SuccessResponse<T> = {
  success: true;
  data: T;
};

export type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export const ok = <T>(reply: FastifyReply, data: T, statusCode = 200) =>
  reply.status(statusCode).send({
    success: true,
    data,
  } satisfies SuccessResponse<T>);

export const fail = (
  reply: FastifyReply,
  code: string,
  message: string,
  statusCode = 500,
  details?: unknown,
) =>
  reply.status(statusCode).send({
    success: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  } satisfies ErrorResponse);
