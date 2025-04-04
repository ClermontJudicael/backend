const pool = require('../config/database');

class Receipts {
    static async create({ reservationId, userId, ticketId, qrCode, amount, paymentMethod = 'credit_card', paymentStatus = 'completed' }) {
        const { rows } = await pool.query(
            `INSERT INTO receipts 
            (reservation_id, user_id, ticket_id, qr_code, amount, payment_method, payment_status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *`,
            [reservationId, userId, ticketId, qrCode, amount, paymentMethod, paymentStatus]
        );
        return rows[0];
    }
    

    static async findByReservation(reservationId) {
        const { rows } = await pool.query(
            'SELECT * FROM receipts WHERE reservation_id = $1',
            [reservationId]
        );
        return rows[0];
    }

    static async findByUser(userId) {
        const { rows } = await pool.query(
            'SELECT * FROM receipts WHERE user_id = $1 ORDER BY issued_at DESC',
            [userId]
        );
        return rows;
    }

    static async findById(id) {
        const { rows } = await pool.query(
            'SELECT * FROM receipts WHERE id = $1',
            [id]
        );
        return rows[0];
    }
}

module.exports = Receipts;