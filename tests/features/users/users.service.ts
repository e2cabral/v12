import { ConflictError, NotFoundError } from '../../../src/core/errors/app-error.js';
import type { UserRepository } from './users.repository.js';
import { USER_REPOSITORY } from './users.repository.js';
import type { CreateUserInput } from './users.types.js';
import type { EventBus } from '../../../src/core/events/event-bus.js';

export class UsersService {
  static inject = [USER_REPOSITORY, 'EventBus'] as const;

  constructor(
    private readonly repository: UserRepository,
    private readonly events: EventBus,
  ) {}

  async listUsers() {
    return this.repository.findAll();
  }

  async getUser(id: string) {
    const user = await this.repository.findById(id);

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    return user;
  }

  async createUser(input: CreateUserInput) {
    const existingUsers = await this.repository.findAll();
    const duplicated = existingUsers.find((user) => user.email === input.email);

    if (duplicated) {
      throw new ConflictError('User email already exists', 'USER_EMAIL_CONFLICT');
    }

    const user = await this.repository.create(input);
    this.events.emit('user.created', user);
    return user;
  }
}
