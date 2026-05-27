import { defineModule } from '../../../src/core/http/module.js';
import { InMemoryUserRepository, USER_REPOSITORY } from './users.repository.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { buildUsersRoutes } from './users.routes.js';

export const UsersModule = defineModule({
  name: 'users',
  providers: [
    { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
    UsersService,
    UsersController,
  ],
  routes: buildUsersRoutes(),
  events: [
    {
      event: 'user.created',
      handler: async () => {
        return;
      },
    },
  ],
});
