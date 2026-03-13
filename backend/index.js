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

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: process.env.DB_PASSWORD || "",
  database: "pawgress",
});

export let prisma;

if (process.env.NODE_ENV !== 'test') {
  prisma = new PrismaClient({ adapter });
}

if (process.env.NODE_ENV === 'test') {
  prisma = {
    user: {
      findUnique: async () => {},
    },
    pet: {
      create: async () => {},
    },
  };
}

export const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.post('/api/users/add', async (req, res) => {
  const { id, username, avatarUrl } = req.body;

  try {
    await pool.execute(
      `INSERT IGNORE INTO users (id, username, avatarUrl) VALUES (?, ?, ?)`,
      [id, username, avatarUrl]
    );

    const [rows] = await pool.execute(
      `SELECT id, username, avatarUrl FROM users WHERE id = ?`,
      [id]
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

// app.listen(process.env.PORT, () => {
//   console.log(`Backend running on port ${process.env.PORT}`);
// });

export default app;