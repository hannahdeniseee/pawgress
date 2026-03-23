import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app, prisma } from '../../backend/index.js';

describe('Profile Routes', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: 1,
    auth0Id: 'auth0|123',
    username: 'Shaan',
    createdAt: new Date().toISOString(),
    pet: null,
  };

  it('should return 200 and the user profile', async () => {

    prisma.user = {
      findUnique: vi.fn().mockResolvedValue(mockUser),
    };

    const response = await request(app)
      .get('/api/profile/auth0|123');

    expect(response.status).toBe(200);
  });

  it('should return 404 if the profile does not exist', async () => {

    prisma.user = {
      findUnique: vi.fn().mockResolvedValue(null),
    };

    const response = await request(app)
      .get('/api/profile/nonexistent');

    expect(response.status).toBe(404);
  });

});