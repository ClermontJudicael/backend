const { Pool } = require("pg");

console.log('Tentative de connexion à la base de données avec URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});


class Ticket {
  static async getAllTickets(filters = {}) {
    let client;
    try {
      console.log('Méthode getAllTickets appelée avec les filtres:', filters);
      
      client = await pool.connect();
      let query = 'SELECT * FROM tickets WHERE 1=1';
      const values = [];

      if (filters.event_id) {
        query += ' AND event_id = $' + (values.length + 1);
        values.push(filters.event_id);
      }

      if (filters.type) {
        query += ' AND type ILIKE $' + (values.length + 1);
        values.push(`%${filters.type}%`);
      }

      if (filters.is_active !== undefined) {
        query += ' AND is_active = $' + (values.length + 1);
        values.push(filters.is_active);
      }

      query += ' ORDER BY id ASC';
      
      console.log('Query SQL:', query);
      console.log('Values:', values);

      const result = await client.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Erreur dans getAllTickets:', error);
      throw new Error(`Erreur lors de la récupération des tickets: ${error.message}`);
    } finally {
      if (client) client.release();
    }
  }

  static async findById(id) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query('SELECT * FROM tickets WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        throw new Error('Ticket non trouvé');
      }
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans findById:', error);
      throw new Error(`Erreur lors de la récupération du ticket: ${error.message}`);
    } finally {
      if (client) client.release();
    }
  }

  static async createTicket({ event_id, type, price, available_quantity, purchase_limit = 10, is_active = true }) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query(
        `INSERT INTO tickets 
        (event_id, type, price, available_quantity, purchase_limit, is_active) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`,
        [event_id, type, price, available_quantity, purchase_limit, is_active]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans createTicket:', error);
      throw new Error(`Erreur lors de la création du ticket: ${error.message}`);
    } finally {
      if (client) client.release();
    }
  }

  static async updateTicket(id, updatedTicket) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query(
        `UPDATE tickets 
        SET type = $1, price = $2, available_quantity = $3, 
            purchase_limit = $4, is_active = $5, updated_at = NOW() 
        WHERE id = $6 
        RETURNING *`,
        [
          updatedTicket.type,
          updatedTicket.price,
          updatedTicket.available_quantity,
          updatedTicket.purchase_limit,
          updatedTicket.is_active,
          id
        ]
      );
      if (result.rows.length === 0) {
        throw new Error('Ticket non trouvé');
      }
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans updateTicket:', error);
      throw new Error(`Erreur lors de la mise à jour du ticket: ${error.message}`);
    } finally {
      if (client) client.release();
    }
  }

  static async deleteTicket(id) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        throw new Error('Ticket non trouvé');
      }
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans deleteTicket:', error);
      throw new Error(`Erreur lors de la suppression du ticket: ${error.message}`);
    } finally {
      if (client) client.release();
    }
  }

  // Méthode spécifique pour récupérer les tickets d'un événement
  static async findByEventId(event_id) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query(
        'SELECT * FROM tickets WHERE event_id = $1 ORDER BY price DESC',
        [event_id]
      );
      return result.rows;
    } catch (error) {
      console.error('Erreur dans findByEventId:', error);
      throw new Error(`Erreur lors de la récupération des tickets: ${error.message}`);
    } finally {
      if (client) client.release();
    }
  }

  // Méthode pour mettre à jour la quantité disponible
  static async updateQuantity(id, quantityChange) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query(
        `UPDATE tickets 
        SET available_quantity = available_quantity + $1 
        WHERE id = $2 
        RETURNING *`,
        [quantityChange, id]
      );
      if (result.rows.length === 0) {
        throw new Error('Ticket non trouvé');
      }
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans updateQuantity:', error);
      throw new Error(`Erreur lors de la mise à jour de la quantité: ${error.message}`);
    } finally {
      if (client) client.release();
    }
  }
}

module.exports = Ticket;