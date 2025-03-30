const { Pool } = require("pg");

console.log('Tentative de connexion à la base de données avec URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test de la connexion
pool.connect((err, client, release) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
  } else {
    console.log('Connexion à la base de données réussie');
    release();
  }
});

class Event {
  static async getAllEvents(filters = {}) {
    let client;
    try {
      client = await pool.connect();
      let query = 'SELECT * FROM events WHERE 1=1';
      const values = [];

      if (filters.date && filters.date !== 'null') {
        query += ' AND date >= $' + (values.length + 1);
        values.push(filters.date);
      }

      if (filters.location && filters.location !== 'null') {
        query += ' AND location ILIKE $' + (values.length + 1);
        values.push(`%${filters.location}%`);
      }

      if (filters.category && filters.category !== 'null') {
        query += ' AND category = $' + (values.length + 1);
        values.push(filters.category);
      }

      if (filters.search && filters.search !== 'null') {
        query += ' AND (title ILIKE $' + (values.length + 1) + ' OR description ILIKE $' + (values.length + 1) + ')';
        values.push(`%${filters.search}%`);
      }

      query += ' ORDER BY date ASC';
      
      const result = await client.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Erreur dans getAllEvents:', error);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  static async getEventById(id) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query('SELECT * FROM events WHERE id = $1', [id]);
      if (!result.rows[0]) {
        throw new Error('Événement non trouvé');
      }
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans getEventById:', error);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  static async createEvent(eventData) {
    let client;
    try {
      client = await pool.connect();
      
      // Validation des champs obligatoires
      const requiredFields = ['title', 'date', 'location', 'category'];
      const missingFields = requiredFields.filter(field => !eventData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Champs manquants: ${missingFields.join(', ')}`);
      }

      const query = {
        text: `
          INSERT INTO events (
            title, description, date, location, category,
            image_url, image_alt, organizer_id, max_attendees, is_published
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id, title, description, date, location, category,
                    image_url, image_alt, organizer_id, max_attendees,
                    is_published, created_at, updated_at
        `,
        values: [
          eventData.title,
          eventData.description || null,
          eventData.date,
          eventData.location,
          eventData.category,
          eventData.image_url || null,
          eventData.image_alt || null,
          eventData.organizer_id,
          eventData.max_attendees || null,
          eventData.is_published || false
        ]
      };

      const result = await client.query(query);
      if (!result.rows[0]) {
        throw new Error('Échec de la création de l\'événement');
      }
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans createEvent:', {
        message: error.message,
        code: error.code,
        detail: error.detail
      });
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  static async updateEvent(id, updates) {
    let client;
    try {
      client = await pool.connect();
      
      const fields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && !['id', 'created_at', 'updated_at'].includes(key)) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (fields.length === 0) {
        return this.getEventById(id);
      }

      values.push(id);
      const query = {
        text: `
          UPDATE events
          SET ${fields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `,
        values
      };

      const result = await client.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans updateEvent:', error);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  static async deleteEvent(id) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query(
        'DELETE FROM events WHERE id = $1 RETURNING id', 
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans deleteEvent:', error);
      throw error;
    } finally {
      if (client) client.release();
    }
  }
}

module.exports = Event;