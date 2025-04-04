const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();
const express = require('express');
const { authenticateToken, requireAdmin } = require('./authMiddleware');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const SECRET_KEY = process.env.JWT_SECRET;

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
      { 
        id: user.rows[0].id, 
        username: user.rows[0].username, 
        email: user.rows[0].email,
        role: user.rows[0].role // Add this line
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: { 
        id: user.rows[0].id, 
        email: user.rows[0].email, 
        username: user.rows[0].username,
        role: user.rows[0].role // Add this
      }
    });
    
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.get('/dashboard', authenticateToken, (req, res) => {
  res.json({ message: 'Welcome to your dashboard', user: req.user });
});



// --------------------------------- admin ((((()))))

// Route de connexion spéciale pour les administrateurs
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1 AND role = 'admin'", [email]);
    console.log("Résultat de la requête SQL:", user.rows);
    if (user.rows.length === 0) 
      return res.status(400).json({ error: "Administrateur non trouvé" });

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    console.log("Résultat de la comparaison des mots de passe:", validPassword);
    if (!validPassword) 
      return res.status(401).json({ error: "Identifiants invalides" });
    // Créer un token avec des informations spécifiques pour admin
    const token = jwt.sign(
      { 
        id: user.rows[0].id, 
        username: user.rows[0].username, 
        email: user.rows[0].email,
        role: user.rows[0].role
      },
      SECRET_KEY,
      { expiresIn: "12h" } // Durée plus longue pour les administrateurs
    );

    res.json({
      token,
      user: { 
        id: user.rows[0].id, 
        email: user.rows[0].email, 
        username: user.rows[0].username,
        role: user.rows[0].role
      }
    });
  } catch (err) {
    console.error("Admin login error:", err.message);
    res.status(500).json({ error: "Échec de connexion administrateur" });
  }
});

// Route protégée pour les administrateurs
router.get('/admin/dashboard', authenticateToken, requireAdmin, (req, res) => {
  res.json({ 
    message: 'Bienvenue sur le tableau de bord administrateur', 
    user: req.user 
  });
});

// Route pour récupérer les données pour React-Admin
router.get('/admin/me', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    id: req.user.id,
    fullName: req.user.username,
    email: req.user.email,
    role: req.user.role,
    avatar: null // À implémenter si nécessaire
  });
});



// Route de vérification du token pour React-Admin
router.post('/admin/check-auth', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(401).json({ error: 'Token non fourni' });
  }
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1 AND role = $2', 
      [decoded.id, 'admin']);
    
    if (user.rows.length === 0) {
      return res.status(403).json({ error: 'Utilisateur non administrateur' });
    }
    
    res.json({ 
      valid: true, 
      user: {
        id: user.rows[0].id,
        fullName: user.rows[0].username,
        email: user.rows[0].email,
        role: user.rows[0].role
      }
    });
  } catch (err) {
    console.error('Token check error:', err.message);
    res.status(403).json({ valid: false, error: 'Token invalide ou expiré' });
  }
});

// Route de déconnexion pour React-Admin (côté serveur, aucune action réelle n'est nécessaire puisque 
// les tokens sont stockés côté client, mais utile pour les logs ou invalidation future)
router.post('/admin/logout', authenticateToken, requireAdmin, (req, res) => {
  // Ici, vous pourriez implémenter une liste noire de tokens si nécessaire
  res.json({ success: true, message: 'Déconnexion réussie' });
});

module.exports = router;