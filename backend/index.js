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

const app = express();
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
    const { userId, type, breed, image } = req.body;
    
    const newPet = await prisma.pet.create({
      data: { userId, type, breed, image }
    });
    
    res.status(201).json(newPet);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'You can only have one pet at a time' });
    }
    res.status(500).json({ error: 'Failed to adopt pet' });
  }
});

// app.listen(process.env.PORT, () => {
//   console.log(`Backend running on port ${process.env.PORT}`);
// });

export default app;