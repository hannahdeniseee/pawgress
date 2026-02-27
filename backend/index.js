import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv"; 

// const express = require('express');
// const cors = require('cors');
// const mysql = require('mysql2/promise');
// require('dotenv').config();

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Create MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Save Auth0 user on first login
app.post('/api/users/add', async (req, res) => {
  const { auth0_id, username, avatar_url } = req.body;

  try {
    // Insert user if not exists
    await pool.execute(
      `INSERT IGNORE INTO users (auth0_id, username, avatar_url) VALUES (?, ?, ?)`,
      [auth0_id, username, avatar_url]
    );

    // Retrieve the saved user
    const [rows] = await pool.execute(
      `SELECT id, username, avatar_url FROM users WHERE auth0_id = ?`,
      [auth0_id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Award virtual currency and XP on focus session completion (REQ-4, REQ-5)
// Rewards scale with focus duration: coins = focusMinutes * 2, xp = focusMinutes * 3
app.post('/api/sessions/complete', async (req, res) => {
  const { user_id, focus_minutes } = req.body;

  if (!user_id || !focus_minutes) {
    return res.status(400).json({ error: 'Missing user_id or focus_minutes' });
  }

  const coins = Math.floor(focus_minutes * 2);
  const xp = Math.floor(focus_minutes * 3);

  try {
    // Record the completed session
    await pool.execute(
      `INSERT INTO sessions (user_id, focus_minutes, coins_awarded, xp_awarded, completed_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [user_id, focus_minutes, coins, xp]
    );

    // Update user totals
    await pool.execute(
      `UPDATE users SET coins = coins + ?, xp = xp + ? WHERE id = ?`,
      [coins, xp, user_id]
    );

    // Count sessions completed today (REQ-6)
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS sessions_today FROM sessions
       WHERE user_id = ? AND DATE(completed_at) = CURDATE()`,
      [user_id]
    );

    res.json({ coins, xp, sessions_today: rows[0].sessions_today });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Start backend server
app.listen(process.env.PORT, () => {
  console.log(`Backend running on port ${process.env.PORT}`);
});