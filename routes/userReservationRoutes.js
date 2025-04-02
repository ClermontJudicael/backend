const express = require("express");
const router = express.Router();
const Reservation = require("../models/Reservation");
const { authenticateToken } = require("../authMiddleware");
const { Pool } = require("pg");

// Create a new pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get reservations for the logged-in user
router.get("/my-reservations", authenticateToken, async (req, res) => {
  try {
    const reservations = await Reservation.getAllReservations({ 
      userId: req.user.id,
      status: 'confirmed' // Only show confirmed reservations
    });
    
    if (!reservations || reservations.length === 0) {
      return res.json([]);
    }

    // Populate with event and ticket details
    const populatedReservations = await Promise.all(reservations.map(async (reservation) => {
      const ticketResult = await pool.query('SELECT * FROM tickets WHERE id = $1', [reservation.ticket_id]);
      const eventResult = await pool.query(
        'SELECT * FROM events WHERE id = $1', 
        [ticketResult.rows[0].event_id]
      );
      
      return {
        ...reservation,
        ticket: ticketResult.rows[0],
        event: eventResult.rows[0]
      };
    }));

    res.json(populatedReservations);
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

module.exports = router;