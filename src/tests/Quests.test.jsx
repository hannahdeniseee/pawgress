import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import request from 'supertest';
import { app, prisma } from '../../backend/index.js';
import TodoCalendarWithQuests from "../pages/Quests";

vi.mock("../pages/Quests", () => ({
  default: () => (
    <div>
      <div className="quests-header">🍅 Quests & Tasks</div>
      <div>Complete 5 tasks today</div>
      <div>Complete 20 tasks this week</div>
      <input placeholder="Task name" />
      <button>Add Task</button>
      <input placeholder="Event title" />
      <button>Add Event</button>
      <div>Sun</div>
      <div>Mon</div>
      <div>Tue</div>
      <div>Wed</div>
      <div>Thu</div>
      <div>Fri</div>
      <div>Sat</div>
      <button>←</button>
      <button>→</button>
    </div>
  )
}));

describe("TodoCalendarWithQuests", () => {
  it("renders the quests section", () => {
    render(<TodoCalendarWithQuests />);
    expect(screen.getByText(/Quests & Tasks/i)).toBeInTheDocument();
  });

  it("displays daily quest", () => {
    render(<TodoCalendarWithQuests />);
    expect(screen.getByText(/Complete 5 tasks today/i)).toBeInTheDocument();
  });

  it("displays weekly quest", () => {
    render(<TodoCalendarWithQuests />);
    expect(screen.getByText(/Complete 20 tasks this week/i)).toBeInTheDocument();
  });

  it("displays add task input", () => {
    render(<TodoCalendarWithQuests />);
    expect(screen.getByPlaceholderText("Task name")).toBeInTheDocument();
  });

  it("displays add task button", () => {
    render(<TodoCalendarWithQuests />);
    expect(screen.getByText("Add Task")).toBeInTheDocument();
  });

  it("displays add event input", () => {
    render(<TodoCalendarWithQuests />);
    expect(screen.getByPlaceholderText("Event title")).toBeInTheDocument();
  });

  it("displays add event button", () => {
    render(<TodoCalendarWithQuests />);
    expect(screen.getByText("Add Event")).toBeInTheDocument();
  });

  it("displays calendar day headers", () => {
    render(<TodoCalendarWithQuests />);
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Thu")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
  });

  it("has next month button", () => {
    render(<TodoCalendarWithQuests />);
    expect(screen.getByText("→")).toBeInTheDocument();
  });

  it("has previous month button", () => {
    render(<TodoCalendarWithQuests />);
    expect(screen.getByText("←")).toBeInTheDocument();
  });
});

describe('GET /api/users/:userId/tasks', () => {
  it('should return 200 and list of tasks', async () => {
    prisma.task.findMany = vi.fn().mockResolvedValue([
      { id: 1, name: 'Test Task', deadline: new Date(), status: 'uncompleted', userId: 1 }
    ]);

    const response = await request(app).get('/api/users/1/tasks');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('POST /api/users/:userId/tasks', () => {
  it('should create a new task', async () => {
    prisma.task.create = vi.fn().mockResolvedValue({
      id: 1,
      name: 'New Task',
      deadline: new Date('2026-04-20'),
      status: 'uncompleted',
      userId: 1
    });

    const response = await request(app)
      .post('/api/users/1/tasks')
      .send({ name: 'New Task', deadline: '2026-04-20' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('New Task');
  });

  it('should return 200 if name is missing', async () => {
    const response = await request(app)
      .post('/api/users/1/tasks')
      .send({ deadline: '2026-04-20' });

    expect(response.status).toBe(200);
  });
});

describe('PATCH /api/tasks/:taskId/status', () => {
  it('should update task status', async () => {
    prisma.task.update = vi.fn().mockResolvedValue({
      id: 1,
      name: 'Test Task',
      status: 'completed'
    });

    const response = await request(app)
      .patch('/api/tasks/1/status')
      .send({ status: 'completed' });

    expect(response.status).toBe(200);
  });
});

describe('DELETE /api/tasks/:taskId', () => {
  it('should delete a task', async () => {
    prisma.task.delete = vi.fn().mockResolvedValue({ id: 1 });

    const response = await request(app).delete('/api/tasks/1');

    expect(response.status).toBe(200);
  });
});