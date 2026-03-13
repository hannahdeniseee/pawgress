import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

dotenv.config();

const adapter = new PrismaMariaDb({
  host: "localhost",
  user: "root",
  database: "pawgress",
});

export const prisma = new PrismaClient({ adapter });

export const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.post('/api/users/add', async (req, res) => {
  const { auth0Id, username, avatarUrl } = req.body;

  try {
    await pool.execute(
      `INSERT IGNORE INTO users (auth0Id, username, avatarUrl) VALUES (?, ?, ?)`,
      [auth0Id, username, avatarUrl]
    );

    const [rows] = await pool.execute(
      `SELECT id, username, avatarUrl FROM users WHERE auth0Id = ?`,
      [auth0Id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/pets/add', async (req, res) => {
  try {
    const newPet = await prisma.pet.create({
      data: {
        userId: req.body.userId,
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

// Fetches the user and their associated pet
app.get('/api/profile/:auth0Id', async (req, res) => {
  const { auth0Id } = req.params;
  const user = await prisma.user.findUnique({
    where: { auth0Id },
    include: { pet: true }
  });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

// Calculates derived metrics for the user dashboard
app.get('/api/profile/:auth0Id/stats', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.params.auth0Id },
      include: { pet: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const accountAgeDays = Math.max(0, Math.floor((now - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)));
    
    const stats = {
      accountAgeDays,
      hasPet: !!user.pet,
      petType: user.pet ? user.pet.type : null,
      petOwnershipDays: user.pet 
        ? Math.max(0, Math.floor((now - new Date(user.pet.createdAt))/(1000 * 60 * 60 * 24))): 0
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

// app.listen(process.env.PORT, () => {
//   console.log(`Backend running on port ${process.env.PORT}`);
// });

// export default app;