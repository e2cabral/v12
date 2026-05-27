import type { RequestContext } from '../../../src/core/http/router.js';
import { UsersService } from './users.service.js';

export class UsersController {
  static inject = [UsersService] as const;

  constructor(private readonly usersService: UsersService) {}

  list = async () => this.usersService.listUsers();

  get = async ({ request }: RequestContext) =>
    this.usersService.getUser((request.params as { id: string }).id);

  create = async ({ request }: RequestContext) =>
    this.usersService.createUser(request.body as { name: string; email: string });
}
