const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();
const express = require('express');
const authenticateToken = require ('./authMiddleware')
const {OAuth2Client} = require("google-auth-library");
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const SECRET_KEY = process.env.JWT_SECRET;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Signup Route
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if email is already taken
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, hashedPassword]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Signup error:", err.message); // Log the actual error
    res.status(500).json({ error: "User registration failed" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) return res.status(400).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

    // Include email in the JWT payload
    const token = jwt.sign(
      { id: user.rows[0].id, username: user.rows[0].username, email: user.rows[0].email }, // Add email to the payload
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: { id: user.rows[0].id, email: user.rows[0].email, username: user.rows[0].username }
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.get('/dashboard', authenticateToken, (req, res) => {
  res.json({ message: 'Welcome to your dashboard', user: req.user });
});

// Google OAuth route
// POST http://localhost:5000/api/auth/googlej
router.post("/google", async (req, res) => {
  const { token } = req.body; // the ID token from Google
  if (!token) {
    return res.status(400).json({ error: "Google token is required" });
  }

  try {
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload; // 'name' will be the user's display name

    // Check if a user with this email already exists
    let userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    let user;

    if (userResult.rows.length === 0) {
      // If user doesn't exist, create a new user.
      // Since password is required, you can store a random hashed password (or a placeholder) for Google users.
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      userResult = await pool.query(
        "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
        [name, email, hashedPassword]
      );
      user = userResult.rows[0];
    } else {
      user = userResult.rows[0];
    }

    // Generate a JWT token with the user info
    const jwtToken = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token: jwtToken, user });
  } catch (err) {
    console.error("Google authentication error:", err.message);
    res.status(400).json({ error: "Invalid Google token" });
  }
});

module.exports = router;