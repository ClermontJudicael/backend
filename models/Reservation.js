const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});


class Reservation {
  static async getAllReservations(filters = {}) {
    let client;
    try {
      client = await pool.connect();
      let query = 'SELECT * FROM reservations WHERE 1=1'; 
      const values = [];
  
      if (filters.userId) {
        query += ' AND user_id = $' + (values.length + 1);
        values.push(filters.userId);
      }
  
      if (filters.ticketId) {
        query += ' AND ticket_id = $' + (values.length + 1);
        values.push(filters.ticketId);
      }
  
      if (filters.status) {
        query += ' AND status = $' + (values.length + 1);
        values.push(filters.status);
      }
  
      query += ' ORDER BY id ASC'; 
      
      const result = await client.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Erreur dans getAllReservations:', error);
      throw new Error(`Erreur lors de la récupération des réservations: ${error.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  static async findById(id) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query('SELECT * FROM reservations WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans findById:', error);
      throw new Error(`Erreur lors de la récupération de la réservation: ${error.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  static async createReservation({ userId, ticketId, quantity, status = 'pending' }) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query(
        'INSERT INTO reservations (user_id, ticket_id, quantity, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, ticketId, quantity, status]
      );
      return result.rows[0]; // Retourne la réservation créée
    } catch (error) {
      console.error('Erreur dans createReservation:', error);
      throw new Error(`Erreur lors de la création de la réservation: ${error.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  static async updateReservation(id, updatedReservation) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query(
        'UPDATE reservations SET ticket_id = $1, quantity = $2, status = $3 WHERE id = $4 RETURNING *',
        [updatedReservation.ticket_id, updatedReservation.quantity, updatedReservation.status, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans updateReservation:', error);
      throw new Error(`Erreur lors de la mise à jour de la réservation: ${error.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  static async deleteReservation(id) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query('DELETE FROM reservations WHERE id = $1', [id]);
      return result.rowCount > 0; // Retourne true si une réservation a été supprimée, sinon false
    } catch (error) {
      console.error('Erreur dans deleteReservation:', error);
      throw new Error(`Erreur lors de la suppression de la réservation: ${error.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  static async countReservations(filters = {}) {
    let client;
    try {
      client = await pool.connect();
      let query = 'SELECT COUNT(*) FROM reservations WHERE 1=1'; 
      const values = [];

      if (filters.status) {
        query += ' AND status = $' + (values.length + 1);
        values.push(filters.status);
      }

      const result = await client.query(query, values);
      return parseInt(result.rows[0].count, 10); // Retourne le nombre total de réservations
    } catch (error) {
      console.error('Erreur dans countReservations:', error);
      throw new Error(`Erreur lors du comptage des réservations: ${error.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }
}

module.exports = Reservation;
