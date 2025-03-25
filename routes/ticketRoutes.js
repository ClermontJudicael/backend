
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authenticateToken = require('../middlewares/authMiddleware');

// Liste de tous les tickets
router.get('/', ticketController.getAllTickets);

// Détail d'un ticket
router.get('/:id', ticketController.getTicketById);

// Créer un ticket (admin ou organisateur)
router.post('/', authenticateToken, ticketController.createTicket);

// Modifier un ticket (admin ou organisateur)
router.put('/:id', authenticateToken, ticketController.updateTicket);

// Supprimer un ticket (admin ou organisateur)
router.delete('/:id', authenticateToken, ticketController.deleteTicket);

module.exports = router;    
