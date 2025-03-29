const { Pool } = require("pg");
const bcrypt = require('bcrypt'); 

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

  static async updateUser(id, updatedUser) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query(
        'UPDATE users SET username = $1, email = $2, role = $3 WHERE id = $4 RETURNING *',
        [updatedUser.username, updatedUser.email, updatedUser.role, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans updateUser:', error);
      throw new Error(`Erreur lors de la mise à jour de l'utilisateur: ${error.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  static async findByEmail(email) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0]; // Retourne l'utilisateur trouvé ou undefined si aucun utilisateur n'est trouvé
    } catch (error) {
      console.error('Erreur dans findByEmail:', error);
      throw new Error(`Erreur lors de la recherche de l'utilisateur par email: ${error.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  static async createUser({ username, email, password, role = 'user' }) {
    let client;
    try {
      client = await pool.connect();

      // Hachage du mot de passe avant de l'enregistrer
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await client.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [username, email, hashedPassword, role]
      );

      return result.rows[0]; // Retourne l'utilisateur créé
    } catch (error) {
      console.error('Erreur dans createUser:', error);
      throw new Error(`Erreur lors de la création de l'utilisateur: ${error.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  static async deleteUser(id) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
      return result.rowCount > 0; // Retourne true si un utilisateur a été supprimé, sinon false
    } catch (error) {
      console.error('Erreur dans deleteUser:', error);
      throw new Error(`Erreur lors de la suppression de l'utilisateur: ${error.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

static async countAdminUsers() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      'SELECT COUNT(*) FROM users WHERE role = $1', 
      ['admin']
    );
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Erreur dans countAdminUsers:', error);
    throw new Error(`Erreur lors du comptage des admins: ${error.message}`);
  } finally {
    if (client) {
      client.release();
    }
  }
}
}




module.exports = User; 
