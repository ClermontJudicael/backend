const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Data temporaires - à remplacer par des requêtes à la BDD
const users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: 'radokely', // 'password'
    role: 'admin'
  },
  {
    id: 2,
    username: 'organizer',
    email: 'organizer@example.com',
    password: 'organisateur', // 'password'
    role: 'organizer'
  },
  {
    id: 3,
    username: 'user',
    email: 'user@example.com',
    password: 'user', // 'password'
    role: 'user'
  }
];

class User {
  static async findByUsername(username) {
    // Temporaire - à remplacer par requête SQL
    return users.find(u => u.username === username);
  }

  static async findById(id) {
    // Temporaire - à remplacer par requête SQL
    return users.find(u => u.id === parseInt(id));
  }

  static async getAllUsers() {
    // Temporaire - à remplacer par requête SQL
    return users.map(({ password, ...user }) => user);
  }

  static async updateUser(id, userData) {
    // Temporaire - à remplacer par requête SQL
    const userIndex = users.findIndex(u => u.id === parseInt(id));
    if (userIndex === -1) return null;
    
    users[userIndex] = {
      ...users[userIndex],
      ...userData,
      id: parseInt(id), // Conserver l'ID original
      password: users[userIndex].password // Ne pas permettre de modifier le mot de passe via cette route
    };
    
    const { password, ...safeUser } = users[userIndex];
    return safeUser;
  }
}

module.exports = User; 