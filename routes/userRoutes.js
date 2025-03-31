
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const reservationController = require('../controllers/reservationController');
const {authenticateToken} = require('../authMiddleware');

console.log('authenticateToken:', authenticateToken);

// Logs pour vérifier les fonctions importées
console.log('getAllUsers:', userController.getAllUsers);
console.log('getUserById:', userController.getUserById);
console.log('updateUser:', userController.updateUser);
console.log('getReservationsByUserId:', reservationController.getReservationsByUserId);


// Liste de tous les utilisateurs (admin uniquement)
router.get('/', authenticateToken, userController.getAllUsers);

// Détail d'un utilisateur
router.get('/:id', authenticateToken, userController.getUserById);

// Modifier un utilisateur
router.put('/:id', authenticateToken, userController.updateUser);

// Réservations d'un utilisateur
router.get('/:id/reservations', authenticateToken, reservationController.getReservationsByUserId);


router.post('/', authenticateToken, userController.createUser);


router.delete('/:id', authenticateToken, userController.deleteUser);


 router.get('/:id/reservations', authenticateToken, reservationController.getReservationsByUserId);

module.exports = router; 


 
 
 
 // Réservations d'un utilisateur
 router.get('/:id/reservations', authenticateToken, require('../controllers/reservationController').getReservationsByUserId);
 
 module.exports = router; 