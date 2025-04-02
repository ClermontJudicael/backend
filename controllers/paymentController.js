const { Pool } = require('pg');
const pool = new Pool();
const generateQRCode = require('../services/qrGenerator');

exports.processPayment = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { userId, eventId, ticketId, quantity, paymentDetails } = req.body;

        // 1. Vérifier la disponibilité du ticket
        const ticketCheck = await client.query(
            'SELECT available_quantity, price FROM tickets WHERE id = $1 AND event_id = $2 FOR UPDATE',
            [ticketId, eventId]
        );

        if (ticketCheck.rows.length === 0) {
            throw new Error('Ticket non disponible');
        }

        const ticket = ticketCheck.rows[0];
        if (ticket.available_quantity < quantity) {
            throw new Error('Quantité insuffisante');
        }

        // 2. Créer la réservation
        const reservation = await client.query(
            `INSERT INTO reservations 
       (user_id, ticket_id, quantity, status, payment_id) 
       VALUES ($1, $2, $3, 'confirmed', $4) 
       RETURNING *`,
            [userId, ticketId, quantity, paymentDetails.paymentId]
        );

        // 3. Mettre à jour la quantité disponible
        await client.query(
            'UPDATE tickets SET available_quantity = available_quantity - $1 WHERE id = $2',
            [quantity, ticketId]
        );

        // 4. Générer le reçu
        const qrCode = await generateQRCode(`RES-${reservation.rows[0].id}-${userId}`);
        const amount = ticket.price * quantity;

        const receipt = await client.query(
            `INSERT INTO receipts 
       (reservation_id, user_id, ticket_id, qr_code, amount, payment_method, payment_status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'completed') 
       RETURNING *`,
            [reservation.rows[0].id, userId, ticketId, qrCode, amount, paymentDetails.method]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: "Paiement confirmé",
            receipt: receipt.rows[0],
            reservation: reservation.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur de paiement:', error);
        res.status(400).json({
            error: error.message || 'Erreur de traitement du paiement'
        });
    } finally {
        client.release();
    }
};