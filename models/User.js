const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const pool = require('../config/database');

class User {
  static async findByUsername(username) {
    const { rows } = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
    );
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const { rows } = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const { rows } = await pool.query(
        'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
        [id]
    );
    return rows[0] || null;
  }

  static async getAllUsers() {
    const { rows } = await pool.query(
        'SELECT id, username, email, role, created_at FROM users'
    );
    return rows;
  }

  static async create({ username, email, password, role = 'user' }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
        [username, email, hashedPassword, role]
    );
    return rows[0];
  }

  static async updateUser(id, { username, email, role }) {
    const { rows } = await pool.query(
        `UPDATE users 
       SET username = $1, email = $2, role = $3 
       WHERE id = $4 
       RETURNING id, username, email, role, created_at`,
        [username, email, role, id]
    );
    return rows[0] || null;
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, id]
    );
    return true;
  }

  static async deleteUser(id) {
    const { rowCount } = await pool.query(
        'DELETE FROM users WHERE id = $1',
        [id]
    );
    return rowCount > 0;
  }

  static async comparePasswords(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}

module.exports = User;