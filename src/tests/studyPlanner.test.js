import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app, prisma } from '../../backend/index.js';

describe('POST /api/users/:userId/events (Study Planner Integration)', () => {

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should successfully save a study event and return status 200', async () => {
    const mockEvent = {
      id: 101,
      userId: 1,
      title: '📖 Review: Physics Exam',
      date: new Date('2026-05-20T00:00:00.000Z'),
      time: '09:00',
      venue: 'Library',
      createdAt: new Date()
    };

    prisma.event.create = vi.fn().mockResolvedValue(mockEvent);

    const response = await request(app)
      .post('/api/users/1/events')
      .send({
        title: '📖 Review: Physics Exam',
        date: '2026-05-20',
        time: '09:00',
        venue: 'Library'
      });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('📖 Review: Physics Exam');
    expect(new Date(response.body.date).toISOString()).toContain('2026-05-20');
    expect(prisma.event.create).toHaveBeenCalledTimes(1);
  });

  it('should return 500 if the Prisma database query fails', async () => {

    prisma.event.create = vi.fn().mockRejectedValue(
      new Error('Prisma Connection Error')
    );

    const response = await request(app)
      .post('/api/users/1/events')
      .send({
        title: 'Broken Test',
        date: '2026-06-01'
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBeDefined();
  });

  it('should return 400 if title or date is missing', async () => {
    const response = await request(app)
      .post('/api/users/1/events')
      .send({
        venue: 'Nowhere'
      });

    expect(response.status).toBe(400);
  });

});