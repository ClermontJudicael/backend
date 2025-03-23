
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authenticateToken = require('../authMiddleware');

// Liste de toutes les réservations (admin uniquement)
router.get('/', authenticateToken, reservationController.getAllReservations);

// Annuler une réservation
router.put('/:id/cancel', authenticateToken, reservationController.cancelReservation);

module.exports = router; 

