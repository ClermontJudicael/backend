const { Pool } = require("pg");
const pool = require('../config/database'); // Supposons que vous avez un fichier database.js qui exporte le pool

class Ticket {
  static async getAllTickets() {
    const { rows } = await pool.query(
        'SELECT * FROM tickets ORDER BY created_at DESC'
    );
    return rows;
  }

  static async getTicketsByEventId(eventId) {
    const { rows } = await pool.query(
        `SELECT id, type, price, available_quantity, purchase_limit, is_active 
       FROM tickets 
       WHERE event_id = $1 AND is_active = true 
       ORDER BY price ASC`,
        [eventId]
    );
    return rows;
  }

  static async getTicketById(id) {
    const { rows } = await pool.query(
        'SELECT * FROM tickets WHERE id = $1',
        [id]
    );
    return rows[0] || null;
  }

  static async createTicket(ticketData) {
    const { event_id, type, price, available_quantity, purchase_limit = 10, is_active = true } = ticketData;

    const { rows } = await pool.query(
        `INSERT INTO tickets 
       (event_id, type, price, available_quantity, purchase_limit, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
        [event_id, type, price, available_quantity, purchase_limit, is_active]
    );

    return rows[0];
  }

  static async updateTicket(id, ticketData) {
    const { type, price, available_quantity, purchase_limit, is_active } = ticketData;

    const { rows } = await pool.query(
        `UPDATE tickets 
       SET type = $1, price = $2, available_quantity = $3, 
           purchase_limit = $4, is_active = $5, updated_at = NOW() 
       WHERE id = $6 
       RETURNING *`,
        [type, price, available_quantity, purchase_limit, is_active, id]
    );

    return rows[0] || null;
  }

  static async deleteTicket(id) {
    const { rowCount } = await pool.query(
        'DELETE FROM tickets WHERE id = $1',
        [id]
    );
    return rowCount > 0;
  }

  static async decreaseAvailableQuantity(ticketId, quantity) {
    const { rows } = await pool.query(
        `UPDATE tickets 
       SET available_quantity = available_quantity - $1 
       WHERE id = $2 AND available_quantity >= $1 
       RETURNING *`,
        [quantity, ticketId]
    );
    return rows[0] || null;
  }

  static async increaseAvailableQuantity(ticketId, quantity) {
    const { rows } = await pool.query(
        `UPDATE tickets 
       SET available_quantity = available_quantity + $1 
       WHERE id = $2 
       RETURNING *`,
        [quantity, ticketId]
    );
    return rows[0] || null;
  }
}

module.exports = Ticket;