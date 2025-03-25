
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');

// Liste de tous les utilisateurs (admin uniquement)
router.get('/', authenticateToken, userController.getAllUsers);

// Détail d'un utilisateur
router.get('/:id', authenticateToken, userController.getUserById);

// Modifier un utilisateur
router.put('/:id', authenticateToken, userController.updateUser);

// Réservations d'un utilisateur
router.get('/:id/reservations', authenticateToken, require('../controllers/reservationController').getReservationsByUserId);

module.exports = router; 
