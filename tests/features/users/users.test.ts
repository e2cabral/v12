import { describe, expect, it } from 'vitest';
import { createTestingApp } from '../../../src/core/testing/testing-app.js';
import { UsersModule } from './users.module.js';

describe('Users Feature', () => {
  it('creates and lists users with standardized responses', async () => {
    const app = await createTestingApp({ modules: [UsersModule] });

    const createResponse = await app.inject({
      method: 'POST',
      url: '/users/',
      payload: {
        name: 'Maria',
        email: 'maria@example.com',
      },
    });

    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.json()).toMatchObject({
      success: true,
      data: {
        name: 'Maria',
        email: 'maria@example.com',
      },
    });

    const listResponse = await app.inject({
      method: 'GET',
      url: '/users/',
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toMatchObject({
      success: true,
      data: [
        {
          name: 'Maria',
          email: 'maria@example.com',
        },
      ],
    });
  });

  it('returns standardized validation errors', async () => {
    const app = await createTestingApp({ modules: [UsersModule] });

    const response = await app.inject({
      method: 'POST',
      url: '/users/',
      payload: {
        name: 'A',
        email: 'invalid-email',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
      },
    });
  });
});
