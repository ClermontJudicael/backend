require("dotenv").config();
const express = require("express");
const cors = require("cors");
const eventRoutes = require("./routes/eventRoutes");
<<<<<<< Updated upstream
const authRoutes = require("./authRoutes"); // Import authentication routes
=======
const authRoutes = require("./authRoutes"); // Import authentication routes
const userRoutes = require("./routes/userRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
>>>>>>> Stashed changes

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Range"],
  exposedHeaders: ["Content-Range", "X-Total-Count"],
}));

app.use(express.json({ limit: "10mb" }));

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

// Test route
app.get("/api/ping", (req, res) => {
  res.json({ status: "active", timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(err.status || 500).json({ error: err.message });
});




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