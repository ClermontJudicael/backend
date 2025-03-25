const pool = require('../config/database');

class Receipts {
    static async create({ userId, ticketId, qrCode, amount }) {
        const { rows } = await pool.query(
            'INSERT INTO receipts (user_id, ticket_id, qr_code, amount) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, ticketId, qrCode, amount]
        );
        return rows[0];
    }
}

module.exports = Receipts;