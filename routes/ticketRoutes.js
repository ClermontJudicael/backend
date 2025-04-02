
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

// Route GET /api/events/:eventId/tickets
router.get('/:eventId/tickets', async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId, 10);

        if (isNaN(eventId)) {
            return res.status(400).json({
                success: false,
                message: "L'ID doit être un nombre entier valide"
            });
        }

        const result = await pool.query(
            'SELECT * FROM tickets WHERE event_id = $1 AND is_active = true',
            [eventId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error("Erreur base de données:", error);
        res.status(500).json({
            success: false,
            message: "Erreur serveur"
        });
    }
});

module.exports = router;    
