import { z } from 'zod';

export const createUserSchema = {
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
};

export const getUserSchema = {
  params: z.object({
    id: z.string().min(1),
  }),
};
