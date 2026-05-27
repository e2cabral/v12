import { createRouter } from '../../../src/core/http/router.js';
import { UsersController } from './users.controller.js';
import { createUserSchema, getUserSchema } from './users.schemas.js';

export const buildUsersRoutes = () => {
  const router = createRouter();

  router.get('/', {
    handler: ({ container }) => container.resolve(UsersController).list(),
  });

  router.get('/:id', {
    schema: getUserSchema,
    handler: (context) => context.container.resolve(UsersController).get(context),
  });

  router.post('/', {
    schema: createUserSchema,
    handler: (context) => context.container.resolve(UsersController).create(context),
  });

  return router.build();
};
