import { ZodError, type ZodTypeAny } from 'zod';
import { ValidationError } from '../errors/app-error.js';

export type RouteSchema = Partial<{
  body: ZodTypeAny;
  params: ZodTypeAny;
  querystring: ZodTypeAny;
  headers: ZodTypeAny;
  response: ZodTypeAny;
}>;

export const validateSchema = <T>(schema: ZodTypeAny, value: T) => {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Validation failed', error.flatten());
    }

    throw error;
  }
};
