import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app, prisma } from '../../backend/index.js';

describe('POST /api/pets/add', () => {

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully save a pet and return status 201', async () => {
    const mockResponse = {
      id: 1,
      userId: 1,
      type: 'Dog',
      breed: 'Labrador',
      image: null
    };

    vi.spyOn(prisma.pet, 'create').mockResolvedValue(mockResponse);

    const response = await request(app)
      .post('/api/pets/add')
      .send({
        userId: 1,
        type: 'Dog',
        breed: 'Labrador',
        image: null
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockResponse);
    expect(prisma.pet.create).toHaveBeenCalledTimes(1);
  });

  it('should return 500 if the database query fails', async () => {
    vi.spyOn(prisma.pet, 'create').mockRejectedValue(
      new Error('DB error')
    );

    const response = await request(app)
      .post('/api/pets/add')
      .send({
        userId: 1,
        type: 'Dog'
      });

    expect(response.status).toBe(500);
  });

  it('should return 400 if the user already owns a pet', async () => {
    const duplicateError = new Error('Duplicate');
    duplicateError.code = 'P2002';

    vi.spyOn(prisma.pet, 'create').mockRejectedValue(duplicateError);

    const response = await request(app)
      .post('/api/pets/add')
      .send({
        userId: 1,
        type: 'Dog'
      });

    expect(response.status).toBe(400);
  });

});