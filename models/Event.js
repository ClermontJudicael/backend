const { Pool } = require("pg");

console.log(
  "Tentative de connexion à la base de données avec URL:",
  process.env.DATABASE_URL
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Test de la connexion
pool.connect((err, client, release) => {
  if (err) {
    console.error("Erreur de connexion à la base de données:", err);
  } else {
    console.log("Connexion à la base de données réussie");
    release();
  }
});

class Event {
  static async getAllEvents(filters = {}) {
    let client;
    try {
      console.log("Méthode getAllEvents appelée avec les filtres:", filters);

      client = await pool.connect();
      let query = "SELECT * FROM events WHERE 1=1";
      const values = [];

      // Ne traiter que les filtres qui ont une valeur valide
      if (filters.date && filters.date !== "null") {
        query += " AND date >= $" + (values.length + 1);
        values.push(filters.date);
      }

      if (filters.location && filters.location !== "null") {
        query += " AND location ILIKE $" + (values.length + 1);
        values.push(`%${filters.location}%`);
      }

      if (filters.category && filters.category !== "null") {
        query += " AND category = $" + (values.length + 1);
        values.push(filters.category);
      }

      if (filters.search && filters.search !== "null") {
        query +=
          " AND (title ILIKE $" +
          (values.length + 1) +
          " OR description ILIKE $" +
          (values.length + 1) +
          ")";
        values.push(`%${filters.search}%`);
      }

      query += " ORDER BY date ASC";

      console.log("Query SQL:", query);
      console.log("Values:", values);

      const result = await client.query(query, values);
      console.log("Résultat de la requête:", result.rows);

      return result.rows;
    } catch (error) {
      console.error("Erreur dans getAllEvents:", error);
      throw new Error(
        `Erreur lors de la récupération des événements: ${error.message}`
      );
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  static async getLastDateEvents() {
    let client;
    try {
      client = await pool.connect();
      let query =
        "SELECT * FROM events WHERE 1=1 and is_published = true ORDER BY DATE DESC limit 6";
      const values = [];

      console.log("Query SQL:", query);
      console.log("Values:", values);

      const result = await client.query(query);
      console.log("Résultat de la requête:", result.rows);

      return result.rows;
    } catch (error) {
      console.error("Erreur dans getAllEvents:", error);
      throw new Error(
        `Erreur lors de la récupération des événements: ${error.message}`
      );
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  static async getEventById(id) {
    let client;
    try {
      console.log("Méthode getEventById appelée avec ID:", id);
      client = await pool.connect();
      const result = await client.query("SELECT * FROM events WHERE id = $1", [
        id,
      ]);
      console.log("Résultat de la requête:", result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error("Erreur dans getEventById:", error);
      throw new Error(
        `Erreur lors de la récupération de l'événement: ${error.message}`
      );
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  static async createEvent(eventData) {
    let client;
    try {
      console.log("Méthode createEvent appelée avec les données:", eventData);
      client = await pool.connect();

      const {
        title,
        description,
        date,
        location,
        category,
        image_url,
        image_alt,
      } = eventData;

      const query = `
        INSERT INTO events (title, description, date, location, category, image_url, image_alt)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        title,
        description,
        date,
        location,
        category,
        image_url || null,
        image_alt || null,
      ];

      console.log("Query SQL:", query);
      console.log("Values:", values);

      const result = await client.query(query, values);
      console.log("Événement créé:", result.rows[0]);

      return result.rows[0];
    } catch (error) {
      console.error("Erreur dans createEvent:", error);
      throw new Error(
        `Erreur lors de la création de l'événement: ${error.message}`
      );
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  static async updateEvent(id, eventData) {
    let client;
    try {
      console.log(
        "Méthode updateEvent appelée avec ID:",
        id,
        "et données:",
        eventData
      );
      client = await pool.connect();

      // Construire la requête de mise à jour dynamiquement
      let updateFields = [];
      let values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(eventData)) {
        if (
          value !== undefined &&
          !["id", "created_at", "updated_at"].includes(key)
        ) {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        return await this.getEventById(id);
      }

      values.push(id);
      const query = `
        UPDATE events
        SET ${updateFields.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      console.log("Query SQL:", query);
      console.log("Values:", values);

      const result = await client.query(query, values);
      console.log("Événement mis à jour:", result.rows[0]);

      return result.rows[0];
    } catch (error) {
      console.error("Erreur dans updateEvent:", error);
      throw new Error(
        `Erreur lors de la mise à jour de l'événement: ${error.message}`
      );
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  static async deleteEvent(id) {
    let client;
    try {
      console.log("Méthode deleteEvent appelée avec ID:", id);
      client = await pool.connect();

      const query = "DELETE FROM events WHERE id = $1 RETURNING *";
      const values = [id];

      console.log("Query SQL:", query);
      console.log("Values:", values);

      const result = await client.query(query, values);
      console.log("Événement supprimé:", result.rows[0]);

      return result.rows[0];
    } catch (error) {
      console.error("Erreur dans deleteEvent:", error);
      throw new Error(
        `Erreur lors de la suppression de l'événement: ${error.message}`
      );
    } finally {
      if (client) {
        client.release();
      }
    }
  }
}

module.exports = Event;
