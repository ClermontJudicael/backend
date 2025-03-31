// Dans votre fichier server.js (modifications clés)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const eventRoutes = require('./routes/eventRoutes'); // Assurez-vous que c'est le bon chemin

const app = express();
const port = process.env.PORT || 5000;

// Middleware CORS amélioré
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Total-Count'],
  exposedHeaders: ['Content-Range', 'X-Total-Count']
}));

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));

// Logging des requêtes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/events', eventRoutes); // Doit être après les middlewares

// Route de test
app.get('/api/ping', (req, res) => {
  res.json({ status: 'active', timestamp: new Date() });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
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