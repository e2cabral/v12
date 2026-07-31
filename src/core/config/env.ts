import { z } from 'zod';

type EnvBuilder<T extends z.ZodTypeAny> = {
  schema: T;
  default(value: z.infer<T>): EnvBuilder<z.ZodDefault<T>>;
  required(): EnvBuilder<T>;
};

const createEnvBuilder = <T extends z.ZodTypeAny>(schema: T): EnvBuilder<T> => ({
  schema,
  default(value) {
    return createEnvBuilder(schema.default(value));
  },
  required() {
    return createEnvBuilder(schema);
  },
});

/**
 * Builders de schema para variáveis de ambiente com coerção automática.
 *
 * @example
 * ```ts
 * const config = defineConfig({
 *   PORT: env.number().default(3000),
 *   DB_URL: env.string().required(),
 *   DEBUG: env.boolean().default(false),
 * });
 * ```
 */
export const env = {
  string: () => createEnvBuilder(z.string()),
  number: () =>
    createEnvBuilder(
      z.coerce.number({
        invalid_type_error: 'Expected a numeric environment variable',
      }),
    ),
  boolean: () => createEnvBuilder(z.coerce.boolean()),
};

/**
 * Define e valida configuração tipada a partir de variáveis de ambiente usando Zod.
 *
 * @param shape - Objeto mapeando nomes de variáveis para builders `env.string()`, `env.number()`, etc.
 * @returns Objeto com método `parse(source?)` que retorna a configuração validada e tipada.
 *
 * @example
 * ```ts
 * const config = defineConfig({
 *   PORT: env.number().default(3000),
 *   DATABASE_URL: env.string().required(),
 * });
 * const { PORT, DATABASE_URL } = config.parse();
 * ```
 */
export const defineConfig = <T extends Record<string, EnvBuilder<z.ZodTypeAny>>>(
  shape: T,
) => {
  const schema = z.object(
    Object.fromEntries(
      Object.entries(shape).map(([key, builder]) => [key, builder.schema]),
    ),
  );

  return {
    parse(source: Record<string, string | undefined> = process.env) {
      return schema.parse(source) as {
        [K in keyof T]: z.infer<T[K]['schema']>;
      };
    },
    schema,
  };
};
