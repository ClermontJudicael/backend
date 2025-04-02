
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

// Nouvelle route pour les réservations utilisateur
router.get('/user/my', authenticateToken, async (req, res) => {
    try {
        const reservations = await pool.query(
            `SELECT r.*, t.type as ticket_type, t.price, e.title as event_title
       FROM reservations r
       JOIN tickets t ON r.ticket_id = t.id
       JOIN events e ON t.event_id = e.id
       WHERE r.user_id = $1`,
            [req.user.id]
        );

        res.json(reservations.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route pour obtenir un reçu spécifique
router.get('/receipts/:id', authenticateToken, async (req, res) => {
    try {
        const receipt = await pool.query(
            `SELECT r.*, e.title as event_title, t.type as ticket_type
       FROM receipts r
       JOIN tickets t ON r.ticket_id = t.id
       JOIN events e ON t.event_id = e.id
       WHERE r.id = $1 AND r.user_id = $2`,
            [req.params.id, req.user.id]
        );

        if (receipt.rows.length === 0) {
            return res.status(404).json({ error: 'Reçu non trouvé' });
        }

        res.json(receipt.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 

