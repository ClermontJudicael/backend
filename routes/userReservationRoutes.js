const express = require("express");
const router = express.Router();
const Reservation = require("../models/Reservation");
const { authenticateToken } = require("../authMiddleware");
const { Pool } = require("pg");
const Receipts = require('../models/Receipts'); // Import your Receipts model
const { v4: uuidv4 } = require('uuid'); // For QR code generation (or use a real library)

// Create a new pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get reservations for the logged-in user
router.get("/my-reservations", authenticateToken, async (req, res) => {
  console.log("Authenticated user:", req.user); // Should show role
  console.log("User ID:", req.user.id); // Should match DB

  try {
    const reservations = await Reservation.getAllReservations({ 
      userId: req.user.id,
      // status: 'confirmed' // Only show confirmed reservations
    });

    console.log("DB Query Results:", reservations);
    
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
    
    console.log("RESERVATION OF USER"+reservations);

  } catch (error) {
    console.error('Error fetching user reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// Confirm a pending reservation
router.put("/:id/confirm", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify reservation exists and belongs to user
    const reservation = await Reservation.findById(id);
    if (!reservation || reservation.user_id !== req.user.id) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    // Only allow confirming pending reservations
    if (reservation.status !== 'pending') {
      return res.status(400).json({ error: "Only pending reservations can be confirmed" });
    }

    // Update reservation status
    const updatedReservation = await Reservation.confirmReservation(id);

    // Get ticket info to calculate price
    const ticketResult = await pool.query("SELECT * FROM tickets WHERE id = $1", [reservation.ticket_id]);
    const ticket = ticketResult.rows[0];

    // Generate QR code (can be a UUID or use a real QR lib)
    const qrCode = uuidv4();

    // Create receipt
    // Create receipt
    const receipt = await Receipts.create({
      reservationId: id, // <-- This is essential
      userId: req.user.id,
      ticketId: reservation.ticket_id,
      qrCode,
      amount: ticket.price * reservation.quantity,
      paymentMethod: 'credit_card',
      paymentStatus: 'completed'
    });

    res.json({
      reservation: updatedReservation,
      receipt
    });
  } catch (error) {
    console.error('Error confirming reservation:', error);
    res.status(500).json({ 
      error: error.message.includes('confirming') 
        ? error.message 
        : 'Failed to confirm reservation' 
    });
  }
});



module.exports = router;