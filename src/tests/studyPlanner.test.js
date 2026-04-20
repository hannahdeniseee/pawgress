import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app, prisma } from '../../backend/index.js';

const validPayload = () => ({
  title: 'Physics Study Session',
  date: '2026-05-20',
  time: '09:00',
  venue: 'Library',
  topics: 'Kinematics, Thermodynamics',
});

const mockCreatedEvent = (overrides = {}) => ({
  id: 101,
  userId: 1,
  title: 'Physics Study Session',
  date: new Date('2026-05-20T00:00:00.000Z'),
  time: '09:00',
  venue: 'Library',
  topics: 'Kinematics, Thermodynamics',
  createdAt: new Date('2026-04-19T08:00:00.000Z'),
  ...overrides,
});

describe('POST /api/users/:userId/events (Study Planner Integration)', () => {

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should return 200 and the created event when all fields are provided', async () => {
    prisma.event.create = vi.fn().mockResolvedValue(mockCreatedEvent());

    const response = await request(app)
      .post('/api/users/1/events')
      .send(validPayload());

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Physics Study Session');
    expect(new Date(response.body.date).toISOString()).toContain('2026-05-20');
    expect(prisma.event.create).toHaveBeenCalledTimes(1);
  });

  it('should pass the correct data to Prisma when creating an event', async () => {
    prisma.event.create = vi.fn().mockResolvedValue(mockCreatedEvent());

    await request(app)
      .post('/api/users/1/events')
      .send(validPayload());

    const callArg = prisma.event.create.mock.calls[0][0];
    expect(callArg.data).toMatchObject({
      title: 'Physics Study Session',
      date: expect.anything(),   // parsed to Date by the backend
      userId: 1,
    });
  });

  it('should create an event with only the required fields (time, venue, topics optional)', async () => {
    const minimalPayload = { title: 'Math Study Session', date: '2026-06-10' };
    prisma.event.create = vi.fn().mockResolvedValue(
      mockCreatedEvent({ title: 'Math Study Session', date: new Date('2026-06-10T00:00:00.000Z'), time: '', venue: '', topics: '' })
    );

    const response = await request(app)
      .post('/api/users/1/events')
      .send(minimalPayload);

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Math Study Session');
    expect(prisma.event.create).toHaveBeenCalledTimes(1);
  });

  it('should correctly use the userId from the URL parameter, not a hardcoded value', async () => {
    const userId = 42;
    prisma.event.create = vi.fn().mockResolvedValue(mockCreatedEvent({ userId }));

    const response = await request(app)
      .post(`/api/users/${userId}/events`)
      .send(validPayload());

    expect(response.status).toBe(200);
    const callArg = prisma.event.create.mock.calls[0][0];
    expect(callArg.data.userId).toBe(userId);
  });

  it('should store multiple events independently (simulates Fibonacci-spaced sessions)', async () => {
    const dates = ['2026-05-01', '2026-05-05', '2026-05-12', '2026-05-20'];
    prisma.event.create = vi.fn().mockImplementation(({ data }) =>
      Promise.resolve(mockCreatedEvent({ date: data.date, title: data.title }))
    );

    const responses = await Promise.all(
      dates.map((date) =>
        request(app)
          .post('/api/users/1/events')
          .send({ title: 'Chemistry Study Session', date })
      )
    );

    responses.forEach((res) => expect(res.status).toBe(200));
    expect(prisma.event.create).toHaveBeenCalledTimes(dates.length);
  });

  it('should return 400 when title is missing', async () => {
    const response = await request(app)
      .post('/api/users/1/events')
      .send({ date: '2026-05-20' });

    expect(response.status).toBe(400);
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it('should return 400 when date is missing', async () => {
    const response = await request(app)
      .post('/api/users/1/events')
      .send({ title: 'History Study Session' });

    expect(response.status).toBe(400);
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it('should return 400 when both title and date are missing', async () => {
    const response = await request(app)
      .post('/api/users/1/events')
      .send({ venue: 'Nowhere' });

    expect(response.status).toBe(400);
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it('should return 500 and an error field when the Prisma query throws', async () => {
    prisma.event.create = vi.fn().mockRejectedValue(
      new Error('Prisma Connection Error')
    );

    const response = await request(app)
      .post('/api/users/1/events')
      .send(validPayload());

    expect(response.status).toBe(500);
    expect(response.body.error).toBeDefined();
  });

  it('should return 500 when Prisma rejects with a unique-constraint violation', async () => {
    const constraintError = new Error('Unique constraint failed on the fields: (`userId`,`date`)');
    constraintError.code = 'P2002'; // Prisma unique-constraint error code
    prisma.event.create = vi.fn().mockRejectedValue(constraintError);

    const response = await request(app)
      .post('/api/users/1/events')
      .send(validPayload());

    expect(response.status).toBe(500);
    expect(response.body.error).toBeDefined();
  });
});