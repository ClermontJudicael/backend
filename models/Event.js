const { Pool } = require('pg');

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
      console.log('Méthode getAllEvents appelée avec les filtres:', filters);
      
      client = await pool.connect();
      let query = 'SELECT * FROM events WHERE 1=1';
      const values = [];

      // Ne traiter que les filtres qui ont une valeur valide
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
      
      console.log('Query SQL:', query);
      console.log('Values:', values);

      const result = await client.query(query, values);
      console.log('Résultat de la requête:', result.rows);
      
      return result.rows;
    } catch (error) {
      console.error('Erreur dans getAllEvents:', error);
      throw new Error(`Erreur lors de la récupération des événements: ${error.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  static async getEventById(id) {
    let client;
    try {
      console.log('Méthode getEventById appelée avec ID:', id);
      client = await pool.connect();
      const result = await client.query('SELECT * FROM events WHERE id = $1', [id]);
      console.log('Résultat de la requête:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans getEventById:', error);
      throw new Error(`Erreur lors de la récupération de l'événement: ${error.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }
}

module.exports = Event; 