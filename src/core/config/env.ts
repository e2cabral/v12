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
