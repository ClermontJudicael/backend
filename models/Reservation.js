const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Data temporaires - à remplacer par des requêtes à la BDD
const reservations = [
  {
    id: 1,
    user_id: 3,
    ticket_id: 1,
    quantity: 2,
    status: 'confirmed',
    created_at: '2024-03-15T10:30:00'
  },
  {
    id: 2,
    user_id: 3,
    ticket_id: 3,
    quantity: 4,
    status: 'confirmed',
    created_at: '2024-03-16T14:45:00'
  }
];

class Reservation {
  static async getAllReservations() {
    // Temporaire - à remplacer par requête SQL
    return reservations;
  }

  static async getReservationsByEventId(eventId, ticketIds) {
    // Temporaire - à remplacer par requête SQL
    return reservations.filter(r => ticketIds.includes(r.ticket_id));
  }

  static async getReservationsByUserId(userId) {
    // Temporaire - à remplacer par requête SQL
    return reservations.filter(r => r.user_id === parseInt(userId));
  }

  static async getReservationById(id) {
    // Temporaire - à remplacer par requête SQL
    return reservations.find(r => r.id === parseInt(id));
  }

  static async createReservation(reservationData) {
    // Temporaire - à remplacer par requête SQL
    const newReservation = {
      id: reservations.length + 1,
      ...reservationData,
      status: 'confirmed',
      created_at: new Date().toISOString()
    };
    
    reservations.push(newReservation);
    return newReservation;
  }

  static async cancelReservation(id) {
    // Temporaire - à remplacer par requête SQL
    const reservationIndex = reservations.findIndex(r => r.id === parseInt(id));
    if (reservationIndex === -1) return null;
    
    reservations[reservationIndex] = {
      ...reservations[reservationIndex],
      status: 'canceled'
    };
    
    return reservations[reservationIndex];
  }
}

module.exports = Reservation; 