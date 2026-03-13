import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.post("/api/users/add", async (req, res) => {
  const { auth0Id, username, avatarUrl } = req.body;

  if (!auth0Id) {
    return res.status(400).json({ error: "auth0Id is required" });
  }

  try {
    const user = await prisma.user.upsert({
      where: { auth0Id },
      update: { username },
      create: { auth0Id, username, avatarUrl, coins: 100},
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "User save error" });
  }
});

app.get("/api/users/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      inventory: true, 
    }
    });

  res.json(user);

});

app.patch("/api/users/:id/coins", async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { coins: { increment: amount } },
    });

    res.json({ coins: user.coins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Coin update error" });
  }
});

app.post("/api/users/:id/inventory", async (req, res) => {
  const { id } = req.params
  const { accessoryId } = req.body

  try {
    const item = await prisma.userAccessory.create({
      data: {
        userId: Number(id),
        accessoryId: Number(accessoryId),
      }
    });

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Coin update error" });
  }
});

// --- CALENDAR BACKEND ---


// Create a new task
app.post("/api/users/:id/tasks", async (req, res) => {
  const { name, deadline } = req.body;
  try {
    const task = await prisma.task.create({
      data: {
        userId: Number(req.params.id),
        name,
        deadline: new Date(deadline),
      },
    });
    res.json(task);
  } catch (err) {
    console.error("Task creation error:", err);
    res.status(500).json({ error: "Task creation error" });
  }
});

// Get all tasks for a user
app.get("/api/users/:id/tasks", async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: Number(req.params.id) },
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Tasks fetch error" });
  }
});

// Update task status
app.patch("/api/tasks/:id/status", async (req, res) => {
  const { status } = req.body;
  try {
    const task = await prisma.task.update({
      where: { id: Number(req.params.id) },
      data: { status },
    });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Task update error" });
  }
});

// Delete task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    await prisma.task.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Task deletion error" });
  }
});

// Create a new event
app.post("/api/users/:id/events", async (req, res) => {
  const { title, date, time, venue } = req.body;
  try {
    const event = await prisma.event.create({
      data: {
        userId: Number(req.params.id),
        title,
        date: new Date(date),
        time,
        venue,
      },
    });
    res.json(event);
  } catch (err) {
    console.error("Event creation error:", err);
    res.status(500).json({ error: "Event creation error" });
  }
});

// Get all events for a user
app.get("/api/users/:id/events", async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { userId: Number(req.params.id) },
    });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Events fetch error" });
  }
});

// Delete an event
app.delete("/api/events/:id", async (req, res) => {
  try {
    await prisma.event.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ message: "Event deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Event deletion error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));