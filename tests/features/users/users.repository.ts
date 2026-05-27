import { randomUUID } from 'node:crypto';
import type { CreateUserInput, User } from './users.types.js';

export const USER_REPOSITORY = 'UserRepository';

export interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserInput): Promise<User>;
}

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  async findAll() {
    return [...this.users.values()];
  }

  async findById(id: string) {
    return this.users.get(id) ?? null;
  }

  async create(data: CreateUserInput) {
    const user = {
      id: randomUUID(),
      ...data,
    };

    this.users.set(user.id, user);
    return user;
  }
}
