import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

vi.mock('../../backend/index.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    prisma: {
      pet: {
        create: vi.fn(),
      },
    },
  };
});

import { app, prisma } from '../../backend/index.js';

describe('POST /api/pets/add', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // If the user does not have pet yet and can be found
  it('should successfully save a pet and return status 201', async () => {
    const mockUserId = 1;
    const mockDbResponse = {
      id: 1,
      userId: mockUserId,
      type: 'Dog',
      breed: 'Golden Retriever',
      image: '../assets/golden-retriever-dog.svg',
      createdAt: new Date().toISOString()
    };

    prisma.pet.create.mockResolvedValue(mockDbResponse);

    const response = await request(app)
      .post('/api/pets/add')
      .send({
        userId: mockUserId,
        type: 'Dog',
        breed: 'Golden Retriever',
        image: '../assets/golden-retriever-dog.svg'
      });

    expect(response.status).toBe(201);
    expect(response.body.userId).toBe(mockUserId);
    
    expect(prisma.pet.create).toHaveBeenCalledTimes(1);
    expect(prisma.pet.create).toHaveBeenCalledWith({
      data: {
        userId: mockUserId,
        type: 'Dog',
        breed: 'Golden Retriever',
        image: '../assets/golden-retriever-dog.svg'
      }
    });
  });

  // If the user is not found
  it('should return 500 if the database query fails', async () => {
    prisma.pet.create.mockRejectedValue(new Error('Database connection lost'));
    const mockUserId = 3;
    const response = await request(app)
      .post('/api/pets/add')
      .send({
        userId: mockUserId,
        type: 'Cat',
        breed: 'Black Cat',
        image: '../assets/black-cat.svg'
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to adopt pet');
  });
  
  // If the user already has pet
  it('should return 400 if the user already owns a pet (Unique Constraint)', async () => {
    const duplicateError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`userId`)',
      { code: 'P2002', clientVersion: '6.19.2' }
    );

    prisma.pet.create.mockRejectedValue(duplicateError);

    const response = await request(app)
      .post('/api/pets/add')
      .send({
        id: 1,
        userId: 1, // user already has a pet in this test case
        type: 'Cat',
        breed: 'Black Cat',
        image: '../assets/black-cat.svg'
      });

    expect(response.status).toBe(400); 
    expect(response.body.error).toBe('You can only have one pet at a time');
  });
});