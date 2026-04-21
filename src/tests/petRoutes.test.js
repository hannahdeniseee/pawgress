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
      image: null,
      name: null,
    };

    vi.spyOn(prisma.pet, 'create').mockResolvedValue(mockResponse);

    const response = await request(app)
      .post('/api/pets/add')
      .send({
        userId: 1,
        type: 'Dog',
        breed: 'Labrador',
        image: null,
        name: null
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockResponse);
    expect(prisma.pet.create).toHaveBeenCalledTimes(1);
  });

  it('should call prisma.pet.create with the correct data shape', async () => {
    const mockResponse = {
      id: 2,
      userId: 1,
      type: 'Cat',
      breed: 'Orange Cat',
      image: '../assets/orange-cat-idle.gif',
      name: 'Muning',
    };
 
    vi.spyOn(prisma.pet, 'create').mockResolvedValue(mockResponse);
 
    await request(app)
      .post('/api/pets/add')
      .send({
        userId: '1',
        type: 'Cat',
        breed: 'Orange Cat',
        image: '../assets/orange-cat-idle.gif',
        name: 'Muning',
      });
 
    expect(prisma.pet.create).toHaveBeenCalledWith({
      data: {
        userId: 1,     
        type: 'Cat',
        breed: 'Orange Cat',
        image: '../assets/orange-cat-idle.gif',
        name: 'Muning',
      },
    });
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
    expect(response.body).toEqual({ error: 'Failed to adopt pet' });
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
    expect(response.body).toEqual({ error: 'You can only have one pet at a time' });
  });

  // full test of all fields
  it('should return the full created pet object on success', async () => {
    const mockResponse = {
      id: 3,
      userId: 5,
      type: 'Bird',
      breed: 'Blue Bird',
      image: '../assets/blue-bird-idle.gif',
      name: 'Sky',
    };
 
    vi.spyOn(prisma.pet, 'create').mockResolvedValue(mockResponse);
 
    const response = await request(app)
      .post('/api/pets/add')
      .send({
        userId: 5,
        type: 'Bird',
        breed: 'Blue Bird',
        image: '../assets/blue-bird-idle.gif',
        name: 'Sky',
      });
 
    expect(response.status).toBe(201);
    expect(response.body.id).toBe(3);
    expect(response.body.type).toBe('Bird');
    expect(response.body.breed).toBe('Blue Bird');
    expect(response.body.name).toBe('Sky');
  });

});