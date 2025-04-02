
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken } = require('../authMiddleware');
const {getEventTickets} = require("../controllers/eventController");

// Liste de tous les tickets
router.get('/', authenticateToken, ticketController.getAllTickets);

// Détail d'un ticket
router.get('/:id',authenticateToken, ticketController.getTicketById);

// Créer un ticket (admin ou organisateur)
router.post('/', authenticateToken, ticketController.createTicket);

// Modifier un ticket (admin ou organisateur)
router.put('/:id', authenticateToken, ticketController.updateTicket);

// Supprimer un ticket (admin ou organisateur)
router.delete('/:id', authenticateToken, ticketController.deleteTicket);

// Ajoutez cette nouvelle route pour les tickets d'événement
router.get('/:id/tickets', authenticateToken, getEventTickets);

module.exports = router;    
