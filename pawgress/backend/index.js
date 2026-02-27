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

// Start backend server
app.listen(process.env.PORT, () => {
  console.log(`Backend running on port ${process.env.PORT}`);
});