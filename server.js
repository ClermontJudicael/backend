require('dotenv').config();
const express = require('express');
const cors = require('cors');
const eventRoutes = require('./routes/eventRoutes');
const { authenticateToken } = require('./authMiddleware');
const authRoutes = require('./authRoutes');
const userRoutes = require('./routes/userRoutes');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  exposedHeaders: ['Content-Range', 'X-Total-Count']
}));

// pour parser le json
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// authentication routes
app.use('/api/auth', authRoutes);

// Add event routes
app.use('/api/events', eventRoutes);

app.use('/api/users', userRoutes);


// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: err.message || 'An error occurred!',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('API URL:', `http://localhost:${port}`);
  console.log('CORS origin:', process.env.CORS_ORIGIN || 'http://localhost:3000');
});
