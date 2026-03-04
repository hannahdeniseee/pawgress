import express from "express";
import cors from "cors";
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
    where: { id: Number(req.params.id) }
  });

  res.json({
    ...user,
    inventory: [], // placeholder until you add inventory to the schema
  });

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

app.listen(process.env.PORT, () => {
  console.log(`Backend running on port ${process.env.PORT}`);
});