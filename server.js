require("dotenv").config();
const express = require("express");
const cors = require("cors");
const eventRoutes = require("./routes/eventRoutes");
const path = require('path'); // Ajoute cette ligne en haut de ton fichier server.js

const authRoutes = require("./authRoutes"); // Import authentication routes
const userRoutes = require("./routes/userRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const userReservationRoutes = require('./routes/userReservationRoutes');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Range", "Accept"],
  exposedHeaders: ["Content-Range", "X-Total-Count", "Authorization"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json({ limit: "10mb" }));

// Ajoutez ce middleware pour debugger les requêtes JSON (à placer LIGNE 24)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/auth/login' && req.method === 'POST') {
    console.log('Body reçu:', req.body); // Debug spécifique pour /login
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }
  }
  next();
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Register routes
app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);  // ✅ Fix: Authentication routes are now registered
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/user-reservations', userReservationRoutes);

// Test route
app.get("/api/ping", (req, res) => {
  res.json({ status: "active", timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(err.status || 500).json({ error: err.message });
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Démarrer le serveur
app.listen(port, () => {
  console.log(`\nServer running on http://localhost:${port}`);
  console.log('Available routes:');
  console.log(`- GET    /api/ping`);
  console.log(`- GET    /api/events`);
  console.log(`- POST   /api/events`);
  console.log(`- PUT    /api/events/:id`);
  console.log(`- DELETE /api/events/:id\n`);
});