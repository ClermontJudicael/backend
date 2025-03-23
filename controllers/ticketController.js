const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Liste de tous les tickets
const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.getAllTickets();
    res.set('Content-Range', `tickets 0-${tickets.length-1}/${tickets.length}`);
    res.set('X-Total-Count', tickets.length);
    res.json(tickets);
  } catch (error) {
    console.error('Erreur dans getAllTickets:', error);
    res.status(500).json({ message: error.message });
  }
};

// Détail d'un ticket
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.getTicketById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }
    
    res.json(ticket);
  } catch (error) {
    console.error('Erreur dans getTicketById:', error);
    res.status(500).json({ message: error.message });
  }
};

// Tickets par événement
const getTicketsByEventId = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    
    // À implémenter: requête SQL pour récupérer les tickets
    // Pour le moment, renvoie un tableau vide
    const tickets = [];
    
    res.set('Content-Range', `tickets 0-${tickets.length-1}/${tickets.length}`);
    res.set('X-Total-Count', tickets.length);
    res.json(tickets);
  } catch (error) {
    console.error('Erreur getTicketsByEventId:', error);
    res.status(500).json({ message: error.message });
  }
};

// Créer un ticket
const createTicket = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    // Si l'utilisateur est un organisateur, vérifier qu'il est bien l'organisateur de l'événement
    const eventId = parseInt(req.body.event_id);
    const event = await Event.getEventById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    if (req.user.role === 'organizer' && event.organizer_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez créer des tickets que pour vos propres événements' });
    }
    
    const newTicket = await Ticket.createTicket(req.body);
    res.status(201).json(newTicket);
  } catch (error) {
    console.error('Erreur dans createTicket:', error);
    res.status(500).json({ message: error.message });
  }
};

// Modifier un ticket
const updateTicket = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    const ticketId = parseInt(req.params.id);
    const ticket = await Ticket.getTicketById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }
    
    // Vérifier si l'utilisateur est l'organisateur de l'événement associé au ticket
    const eventId = ticket.event_id;
    const event = await Event.getEventById(eventId);
    
    if (req.user.role === 'organizer' && event.organizer_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que les tickets de vos propres événements' });
    }
    
    const updatedTicket = await Ticket.updateTicket(ticketId, req.body);
    res.json(updatedTicket);
  } catch (error) {
    console.error('Erreur dans updateTicket:', error);
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un ticket
const deleteTicket = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    const ticketId = parseInt(req.params.id);
    const ticket = await Ticket.getTicketById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }
    
    // Vérifier si l'utilisateur est l'organisateur de l'événement associé au ticket
    const eventId = ticket.event_id;
    const event = await Event.getEventById(eventId);
    
    if (req.user.role === 'organizer' && event.organizer_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que les tickets de vos propres événements' });
    }
    
    await Ticket.deleteTicket(ticketId);
    res.status(204).send();
  } catch (error) {
    console.error('Erreur dans deleteTicket:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllTickets,
  getTicketById,
  getTicketsByEventId,
  createTicket,
  updateTicket,
  deleteTicket
};