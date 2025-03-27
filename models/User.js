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

class User {
  static async getAllUsers(filters = {}) {
    let client;
    try {
      console.log('Méthode getAllUsers appelée avec les filtres:', filters);
      
      client = await pool.connect();
      let query = 'SELECT * FROM users WHERE 1=1'; 
      const values = [];

      // Ne traiter que les filtres qui ont une valeur valide
      if (filters.name && filters.name !== 'null') {
        query += ' AND name ILIKE $' + (values.length + 1);
        values.push(`%${filters.name}%`);
      }

      if (filters.email && filters.email !== 'null') {
        query += ' AND email ILIKE $' + (values.length + 1);
        values.push(`%${filters.email}%`);
      }

      // Ajoutez d'autres filtres si nécessaire

      query += ' ORDER BY id ASC'; 
      
      console.log('Query SQL:', query);
      console.log('Values:', values);

      const result = await client.query(query, values);
      console.log('Résultat de la requête:', result.rows);
      
      return result.rows;
    } catch (error) {
      console.error('Erreur dans getAllUsers:', error);
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
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
      const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans getUserById:', error);
      throw new Error(`Erreur lors de la récupération de l'utilisateur: ${error.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }
}


module.exports = User; 
