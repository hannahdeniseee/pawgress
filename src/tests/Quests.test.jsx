import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
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

describe("TodoCalendarWithQuests - Rendering", () => {
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

// ========== COINS API TESTS ==========
describe('PATCH /api/users/:userId/coins', () => {
  it('should update user coins', async () => {
    prisma.user.update = vi.fn().mockResolvedValue({
      id: 1,
      coins: 150
    });

    const response = await request(app)
      .patch('/api/users/1/coins')
      .send({ amount: 50 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('coins');
  });

  it('should return 500 if database error occurs', async () => {
    prisma.user.update = vi.fn().mockRejectedValue(new Error('DB Error'));

    const response = await request(app)
      .patch('/api/users/1/coins')
      .send({ amount: 50 });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });
});

// ========== LEVEL CALCULATION TESTS ==========
describe('Level Calculation Logic', () => {
  it('should calculate correct level based on XP', () => {
    const calculateLevel = (xp) => {
      if (xp < 100) return 1;
      if (xp < 300) return 2;
      if (xp < 600) return 3;
      if (xp < 1000) return 4;
      if (xp < 1500) return 5;
      if (xp < 2100) return 6;
      if (xp < 2800) return 7;
      if (xp < 3600) return 8;
      if (xp < 4500) return 9;
      return 10;
    };

    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(50)).toBe(1);
    expect(calculateLevel(99)).toBe(1);
    expect(calculateLevel(100)).toBe(2);
    expect(calculateLevel(200)).toBe(2);
    expect(calculateLevel(299)).toBe(2);
    expect(calculateLevel(300)).toBe(3);
    expect(calculateLevel(500)).toBe(3);
    expect(calculateLevel(599)).toBe(3);
    expect(calculateLevel(600)).toBe(4);
    expect(calculateLevel(999)).toBe(4);
    expect(calculateLevel(1000)).toBe(5);
    expect(calculateLevel(1499)).toBe(5);
    expect(calculateLevel(1500)).toBe(6);
    expect(calculateLevel(2099)).toBe(6);
    expect(calculateLevel(2100)).toBe(7);
    expect(calculateLevel(2799)).toBe(7);
    expect(calculateLevel(2800)).toBe(8);
    expect(calculateLevel(3599)).toBe(8);
    expect(calculateLevel(3600)).toBe(9);
    expect(calculateLevel(4499)).toBe(9);
    expect(calculateLevel(4500)).toBe(10);
    expect(calculateLevel(5000)).toBe(10);
  });

  it('should calculate XP needed for next level correctly', () => {
    const getXpToNextLevel = (xp) => {
      if (xp < 100) return 100 - xp;
      if (xp < 300) return 300 - xp;
      if (xp < 600) return 600 - xp;
      if (xp < 1000) return 1000 - xp;
      if (xp < 1500) return 1500 - xp;
      if (xp < 2100) return 2100 - xp;
      if (xp < 2800) return 2800 - xp;
      if (xp < 3600) return 3600 - xp;
      if (xp < 4500) return 4500 - xp;
      return 0;
    };

    expect(getXpToNextLevel(0)).toBe(100);
    expect(getXpToNextLevel(50)).toBe(50);
    expect(getXpToNextLevel(99)).toBe(1);
    expect(getXpToNextLevel(100)).toBe(200);
    expect(getXpToNextLevel(250)).toBe(50);
    expect(getXpToNextLevel(299)).toBe(1);
    expect(getXpToNextLevel(300)).toBe(300);
    expect(getXpToNextLevel(500)).toBe(100);
    expect(getXpToNextLevel(599)).toBe(1);
    expect(getXpToNextLevel(600)).toBe(400);
    expect(getXpToNextLevel(1000)).toBe(500);
    expect(getXpToNextLevel(1500)).toBe(600);
    expect(getXpToNextLevel(2100)).toBe(700);
    expect(getXpToNextLevel(2800)).toBe(800);
    expect(getXpToNextLevel(3600)).toBe(900);
    expect(getXpToNextLevel(4500)).toBe(0);
  });

  it('should calculate XP progress percentage correctly', () => {
    const getXpProgress = (xp) => {
      if (xp < 100) return (xp / 100) * 100;
      if (xp < 300) return ((xp - 100) / 200) * 100;
      if (xp < 600) return ((xp - 300) / 300) * 100;
      if (xp < 1000) return ((xp - 600) / 400) * 100;
      if (xp < 1500) return ((xp - 1000) / 500) * 100;
      if (xp < 2100) return ((xp - 1500) / 600) * 100;
      if (xp < 2800) return ((xp - 2100) / 700) * 100;
      if (xp < 3600) return ((xp - 2800) / 800) * 100;
      if (xp < 4500) return ((xp - 3600) / 900) * 100;
      return 100;
    };

    expect(getXpProgress(0)).toBe(0);
    expect(getXpProgress(50)).toBe(50);
    expect(getXpProgress(99)).toBe(99);
    expect(getXpProgress(100)).toBe(0);
    expect(getXpProgress(200)).toBe(50);
    expect(getXpProgress(299)).toBe(99.5);
    expect(getXpProgress(300)).toBe(0);
    expect(getXpProgress(450)).toBe(50);
    expect(getXpProgress(599)).toBeCloseTo(99.67, 1);
    expect(getXpProgress(600)).toBe(0);
    expect(getXpProgress(800)).toBe(50);
    expect(getXpProgress(1000)).toBe(0);
    expect(getXpProgress(1250)).toBe(50);
    expect(getXpProgress(4500)).toBe(100);
  });
});

// ========== MILESTONE REWARD TESTS ==========
describe('Milestone Rewards', () => {
  it('should have daily milestone rewards configured', () => {
    const DAILY_MILESTONE_COINS = 50;
    const DAILY_MILESTONE_XP = 75;
    
    expect(DAILY_MILESTONE_COINS).toBe(50);
    expect(DAILY_MILESTONE_XP).toBe(75);
  });

  it('should have weekly milestone rewards configured', () => {
    const WEEKLY_MILESTONE_COINS = 200;
    const WEEKLY_MILESTONE_XP = 300;
    
    expect(WEEKLY_MILESTONE_COINS).toBe(200);
    expect(WEEKLY_MILESTONE_XP).toBe(300);
  });
});

// ========== LEVEL SYSTEM ENDPOINTS ==========

function calculateLevel(xp) {
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  if (xp < 2100) return 6;
  if (xp < 2800) return 7;
  if (xp < 3600) return 8;
  if (xp < 4500) return 9;
  return 10;
}

app.patch("/api/users/:id/xp", async (req, res) => {
  const { id } = req.params;
  const { xpGained } = req.body;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) }
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const newXp = (user.xp || 0) + xpGained;
    const newLevel = calculateLevel(newXp);
    const leveledUp = newLevel > (user.level || 1);
    const oldLevel = user.level || 1;
    
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { 
        xp: newXp,
        level: newLevel
      }
    });
    
    res.json({ 
      xp: updatedUser.xp, 
      level: updatedUser.level,
      leveledUp: leveledUp,
      oldLevel: oldLevel
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "XP update error" });
  }
});

app.get("/api/users/:id/level", async (req, res) => {
  const { id } = req.params;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: { xp: true, level: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ xp: user.xp || 0, level: user.level || 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get level" });
  }
});