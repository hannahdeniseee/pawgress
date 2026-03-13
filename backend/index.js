import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

dotenv.config();

const adapter = new PrismaMariaDb({
  host: "localhost",
  user: "root",
  database: "pawgress",
});

export const prisma = new PrismaClient({ adapter });

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

// Search user by username (must be above /:id to avoid matching "search" as an id)
app.get("/api/users/search", async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: "username required" });

  try {
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

app.listen(process.env.PORT, () => {
  console.log(`Backend running on port ${process.env.PORT}`);
});