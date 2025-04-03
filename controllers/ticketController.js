const Ticket = require('../models/Ticket');
const Event = require('../models/Event'); // Supposons que vous ayez un modèle Event

// Liste de tous les tickets
const getAllTickets = async (req, res) => {
  try {
    // Seuls admin et organizer peuvent voir tous les tickets
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Non autorisé. Rôle admin ou organizer requis.' });
    }

    const tickets = await Ticket.getAllTickets(req.query);
    
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
    const ticketId = parseInt(req.params.id);
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }

    // Vérification des permissions
    if (req.user.role === 'user') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Erreur dans getTicketById:', error);
    res.status(500).json({ message: error.message });
  }
};

// Créer un nouveau ticket
const createTicket = async (req, res) => {
  try {
    // Seuls admin et organizer peuvent créer des tickets
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Non autorisé. Rôle admin ou organizer requis.' });
    }

    // Validation des données
    const { event_id, type, price, available_quantity } = req.body;
    if (!event_id || !type || !price || !available_quantity) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    // Vérifier que l'événement existe
    const event = await Event.findById(event_id); // Supposons que vous ayez cette méthode
    if (!event) {
      return res.status(400).json({ message: 'Événement non trouvé' });
    }

    // Vérifier que l'organizer est bien le propriétaire de l'event (s'il n'est pas admin)
    if (req.user.role === 'organizer' && event.organizer_id !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé à créer des tickets pour cet événement' });
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
    const ticketId = parseInt(req.params.id);
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }

    // Seuls admin et organizer peuvent modifier des tickets
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Vérifier que l'organizer est bien le propriétaire de l'event (s'il n'est pas admin)
    if (req.user.role === 'organizer') {
      const event = await Event.findById(ticket.event_id);
      if (event.organizer_id !== req.user.id) {
        return res.status(403).json({ message: 'Non autorisé à modifier ce ticket' });
      }
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
    const ticketId = parseInt(req.params.id);
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }

    // Seuls admin et organizer peuvent supprimer des tickets
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Vérifier que l'organizer est bien le propriétaire de l'event (s'il n'est pas admin)
    if (req.user.role === 'organizer') {
      const event = await Event.findById(ticket.event_id);
      if (event.organizer_id !== req.user.id) {
        return res.status(403).json({ message: 'Non autorisé à supprimer ce ticket' });
      }
    }

    await Ticket.deleteTicket(ticketId);
    res.json({ message: 'Ticket supprimé avec succès' });
  } catch (error) {
    console.error('Erreur dans deleteTicket:', error);
    res.status(500).json({ message: error.message });
  }
};

// Liste des tickets pour un événement spécifique
const getTicketsForEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const tickets = await Ticket.findByEventId(eventId);
    
    res.set('Content-Range', `tickets 0-${tickets.length-1}/${tickets.length}`);
    res.set('X-Total-Count', tickets.length);
    res.json(tickets);
  } catch (error) {
    console.error('Erreur dans getTicketsForEvent:', error);
    res.status(500).json({ message: error.message });
  }
};


// Liste des tickets pour un événement spécifique
const getTicketsByEventId = async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const tickets = await Ticket.findByEventId(eventId);

    if (!tickets || tickets.length === 0) {
      return res.status(404).json({ message: 'Aucun ticket disponible' });
    }

    // Option : Filtrer les tickets non disponibles si nécessaire
    const availableTickets = tickets.filter(ticket => ticket.available_quantity > 0);

    res.json(availableTickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketsForEvent,
  getTicketsByEventId
};