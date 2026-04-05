import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

dotenv.config();

const adapter = new PrismaMariaDb({
  host: "localhost",
  user: "root",
  database: "pawgress",
});

export let prisma = new PrismaClient({ adapter });

if (process.env.NODE_ENV == "test") {
  prisma = {
    pet: {
      create: async () => {},
    },
  };
}

export const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Create or update a user in the database
app.post('/api/users/add', async (req, res) => {
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

// Save a new pet to the database and link to a user
app.post('/api/pets/add', async (req, res) => {
  try {
    const newPet = await prisma.pet.create({
      data: {
        userId: Number(req.body.userId),
        type: req.body.type,
        breed: req.body.breed,
        image: req.body.image,
      },
    });
    
    res.status(201).json(newPet);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'You can only have one pet at a time' });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to adopt pet' });
  }
});

// Search user by username (must be above /:id to avoid matching "search" as an id)
app.get("/api/users/search", async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: "username required" });

  try {
    await pool.execute(
      `INSERT IGNORE INTO users (id, username, avatarUrl) VALUES (?, ?, ?)`,
      [id, username, avatarUrl]
    );

    const [rows] = await pool.execute(
      `SELECT id, username, avatarUrl FROM users WHERE id = ?`,
      [id]
    );
    const user = await prisma.user.findFirst({
      where: { username },
      select: { id: true, username: true, avatarUrl: true },
    });

    if (!user) return res.status(404).json({ error: "No users were found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search error" });
  }
});

// Return a user and their inventory
// app.get("/api/users/:id", async (req, res) => {
//   const user = await prisma.user.findUnique({
//     where: { id: Number(req.params.id) },
//     include: {
//       inventory: true, 
//       equipped: true,
//       pet: true,
//     }
//     });

//   res.json(user);

// });

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        inventory: true,
        equipped: true,
        pet: true,
      }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const equippedMap = Object.fromEntries(
      user.equipped.map((e) => [e.slot, e.accessoryId])
    );

    res.json({
      ...user,
      equipped: equippedMap,
      petImage: user.pet[0]?.image || null,  // ← this is what the frontend reads
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Increment or decrement a user's coin balance by a given amount
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

// Adds an accessory item to a user's inventory
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

// Send friend request
app.post("/api/friends/request", async (req, res) => {
  const { requesterId, receiverId } = req.body;

  if (requesterId === receiverId) {
    return res.status(400).json({ error: "Cannot friend yourself" });
  }

  try {
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId },
        ],
      },
    });

    if (existing) return res.status(400).json({ error: "Friendship already exists" });

    const friendship = await prisma.friendship.create({
      data: { requesterId, receiverId, status: "PENDING" },
    });

    res.json(friendship);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Friend request error" });
  }
});

// Get pending requests received by userId
app.get("/api/friends/:userId/pending", async (req, res) => {
  const userId = Number(req.params.userId);

  try {
    const requests = await prisma.friendship.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: {
        requester: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Pending requests error" });
  }
});

// Get accepted friends for userId
app.get("/api/friends/:userId", async (req, res) => {
  const userId = Number(req.params.userId);

  try {
    const friends = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: "ACCEPTED" },
          { receiverId: userId, status: "ACCEPTED" },
        ],
      },
      include: {
        requester: { select: { id: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    res.json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Friends list error" });
  }
});

// Accept or decline a friend request
app.patch("/api/friends/:id/respond", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["ACCEPTED", "DECLINED"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const friendship = await prisma.friendship.update({
      where: { id: Number(id) },
      data: { status },
    });

    res.json(friendship);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Respond error" });
  }
});

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

// Return account age and pet ownership duration 
app.get('/api/stats', async (req, res) => {
  const { auth0Id } = req.query;
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id  },
      include: { pet: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = new Date();
    const accountAgeDays = Math.floor((now - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));
    
    const petOwnershipDays = user.pet && user.pet.length > 0
      ? Math.floor((now - new Date(user.pet[0].createdAt)) / (1000 * 60 * 60 * 24))
      : 0;

    res.json({ accountAgeDays, petOwnershipDays });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Return a user's full profile including their pet
app.get('/api/profile/:auth0Id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.params.auth0Id },
      include: { pet: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Equip an accessory into a slot (replaces whatever was there before)
app.put("/api/users/:id/equipped", async (req, res) => {
  const { id } = req.params;
  const { slot, accessoryId } = req.body;
 
  if (!slot || !accessoryId) {
    return res.status(400).json({ error: "slot and accessoryId are required" });
  }
 
  try {
    const equipped = await prisma.equippedItem.upsert({
      where: {
        userId_slot: { userId: Number(id), slot },
      },
      update: { accessoryId: Number(accessoryId) },
      create: {
        userId: Number(id),
        slot,
        accessoryId: Number(accessoryId),
      },
    });
 
    res.json(equipped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Equip error" });
  }
});
 
 
// Unequip an accessory from a slot
app.delete("/api/users/:id/equipped", async (req, res) => {
  const { id } = req.params;
  const { slot } = req.body;
 
  if (!slot) {
    return res.status(400).json({ error: "slot is required" });
  }
 
  try {
    await prisma.equippedItem.delete({
      where: {
        userId_slot: { userId: Number(id), slot },
      },
    });
 
    res.json({ success: true });
  } catch (err) {
    if (err.code === "P2025") return res.json({ success: true }); // already unequipped, that's fine
    console.error(err);
    res.status(500).json({ error: "Unequip error" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Backend running on port ${process.env.PORT}`);
});

export default app;
