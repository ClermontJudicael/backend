const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Data temporaires - à remplacer par des requêtes à la BDD
const tickets = [
  {
    id: 1,
    event_id: 1,
    type: 'VIP',
    price: 100.00,
    available_quantity: 50,
    purchase_limit: 2,
    is_active: true
  },
  {
    id: 2,
    event_id: 1,
    type: 'Standard',
    price: 50.00,
    available_quantity: 100,
    purchase_limit: 5,
    is_active: true
  },
  {
    id: 3,
    event_id: 2,
    type: 'Early Bird',
    price: 30.00,
    available_quantity: 200,
    purchase_limit: 10,
    is_active: true
  }
];

class Ticket {
  static async getAllTickets() {
    // Temporaire - à remplacer par requête SQL
    return tickets;
  }

  static async getTicketsByEventId(eventId) {
    // Temporaire - à remplacer par requête SQL
    return tickets.filter(t => t.event_id === parseInt(eventId));
  }

  static async getTicketById(id) {
    // Temporaire - à remplacer par requête SQL
    return tickets.find(t => t.id === parseInt(id));
  }

  static async createTicket(ticketData) {
    // Temporaire - à remplacer par requête SQL
    const newTicket = {
      id: tickets.length + 1,
      ...ticketData,
      is_active: ticketData.is_active !== undefined ? ticketData.is_active : true
    };
    
    tickets.push(newTicket);
    return newTicket;
  }

  static async updateTicket(id, ticketData) {
    // Temporaire - à remplacer par requête SQL
    const ticketIndex = tickets.findIndex(t => t.id === parseInt(id));
    if (ticketIndex === -1) return null;
    
    const eventId = tickets[ticketIndex].event_id;
    
    tickets[ticketIndex] = {
      ...tickets[ticketIndex],
      ...ticketData,
      id: parseInt(id), // Conserver l'ID original
      event_id: eventId // Ne pas permettre de changer l'événement associé
    };
    
    return tickets[ticketIndex];
  }

  static async deleteTicket(id) {
    // Temporaire - à remplacer par requête SQL
    const ticketIndex = tickets.findIndex(t => t.id === parseInt(id));
    if (ticketIndex === -1) return false;
    
    tickets.splice(ticketIndex, 1);
    return true;
  }
}

module.exports = Ticket; 