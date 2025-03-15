const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const SECRET_KEY = process.env.JWT_SECRET;

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  // Extract token from Authorization header
  const token = req.header('Authorization')?.replace('Bearer ', ''); 
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = verify(token, SECRET_KEY);
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user.rows[0]; // Attach user data to request
    next(); // Allow the request to proceed to the dashboard route
  } catch (err) {
    console.error('Authentication error:', err.message);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticateToken