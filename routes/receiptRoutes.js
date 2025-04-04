const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const authMiddleware = require('../authMiddleware');

// Route pour créer un reçu
router.post('/', authMiddleware, receiptController.createReceipt);

// Route pour obtenir un reçu par ID
router.get('/:id', authMiddleware, receiptController.getReceiptById);

// Route pour obtenir les reçus d'un utilisateur
router.get('/user/:userId', authMiddleware, receiptController.getReceiptsByUser);

// Route pour obtenir un reçu par réservation
router.get('/reservation/:reservationId', authMiddleware, receiptController.getReceiptByReservation);

module.exports = router;