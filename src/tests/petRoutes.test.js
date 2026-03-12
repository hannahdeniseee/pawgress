import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from './app';
import prisma from './prismaClient';

vi.mock('./prismaClient', () => ({
  default: {
    pet: {
      create: vi.fn(),
    },
  },
}));

describe('POST /api/pets/add', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully save a pet and return status 201', async () => {
    const mockDbResponse = {
      id: 1,
      userId: 'auth0|12345',
      type: 'Dog',
      breed: 'Golden Retriever',
      image: '../assets/golden-retriever.svg',
      createdAt: new Date().toISOString()
    };

    prisma.pet.create.mockResolvedValue(mockDbResponse);

    const response = await request(app)
      .post('/api/pets/add')
      .send({
        userId: 'auth0|12345',
        type: 'Dog',
        breed: 'Golden Retriever',
        image: '../assets/golden-retriever.svg'
      });

    expect(response.status).toBe(201);
    expect(response.body.breed).toBe('Golden Retriever');
    expect(response.body.id).toBe(1);

    expect(prisma.pet.create).toHaveBeenCalledTimes(1);
    expect(prisma.pet.create).toHaveBeenCalledWith({
      data: {
        userId: 'auth0|12345',
        type: 'Dog',
        breed: 'Golden Retriever',
        image: '../assets/golden-retriever.svg'
      }
    });
  });

  it('should return 500 if the database query fails', async () => {
    prisma.pet.create.mockRejectedValue(new Error('Database connection lost'));

    const response = await request(app)
      .post('/api/pets/add')
      .send({
        userId: 'auth0|12345',
        type: 'Cat',
        breed: 'Siamese'
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to adopt pet');
  });
});

describe('POST /api/pets/add - 1:1 Constraint', () => {

  it('should return 400 if the user already owns a pet (Unique Constraint)', async () => {
    const duplicateError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`userId`)',
      { code: 'P2002', clientVersion: '5.0.0' }
    );

    prisma.pet.create.mockRejectedValue(duplicateError);

    const response = await request(app)
      .post('/api/pets/add')
      .send({
        userId: 1, // user already has a pet in this test case
        type: 'Cat',
        breed: 'Siamese',
        image: '../assets/siamese.svg'
      });

    expect(response.status).toBe(400); 
    expect(response.body.error).toBe('You can only have one pet at a time.');
  });
});