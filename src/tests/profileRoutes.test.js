import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Prisma } from '@prisma/client';

vi.mock('../../backend/index.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    prisma: {
      user: {
        findUnique: vi.fn(),
      },
    },
  };
});

import { app, prisma } from '../../backend/index.js';

describe('Profile Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: 1,
    auth0Id: 'auth0|123',
    username: 'Shaan',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    pet: {
      type: 'Dog',
      breed: 'Golden Retriever',
      image: '../assets/golden-retriever-dog.svg',
      createdAt: new Date().toISOString()
    }
  };

  it('should return 200 and the user profile', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const response = await request(app).get('/api/profile/auth0|123');

    expect(response.status).toBe(200);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { auth0Id: 'auth0|123' },
      include: { pet: true }
    });
  });

  it('should return 404 if the profile does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const response = await request(app).get('/api/profile/nonexistent');

    expect(response.status).toBe(404);
  });
});