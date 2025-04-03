
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const {authenticateToken} = require('../authMiddleware');

// Logs pour vérifier les fonctions importées
console.log('getAllReservations:', reservationController.getAllReservations);
console.log('getConfirmedReservations:', reservationController.getConfirmedReservations);
console.log('cancelReservation:', reservationController.cancelReservation);

// Liste de toutes les réservations (admin uniquement)
router.get('/', authenticateToken, reservationController.getAllReservations);

// Récupérer les réservations confirmées
router.get('/confirmed', authenticateToken, reservationController.getConfirmedReservations);

// Annuler une réservation
router.put('/:id/cancel', authenticateToken, reservationController.cancelReservation);
// Récupérer une réservation spécifique (GET /api/reservations/:id)
router.get('/:id', authenticateToken, reservationController.getOneReservation);

router.delete('/reservations/:id', authenticateToken, reservationController.cancelReservation);

// route /my
router.get('/my', authenticateToken, reservationController.getReservationsByUserId);

router.post('/:id/pay', authenticateToken, reservationController.processPayment);

router.post('/', authenticateToken, reservationController.createReservation);

module.exports = router; 

