const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

// Liste de tous les événements
const getAllEvents = async (req, res) => {
  try {
    // Autorisation: tout le monde peut voir les événements publiés
    const filter = { ...req.query };
    
    // Si ce n'est pas un admin/organizer, on ne montre que les événements publiés
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      filter.is_published = true;
    }

    const events = await Event.getAllEvents(filter);
    
    res.set('Content-Range', `events 0-${events.length-1}/${events.length}`);
    res.set('X-Total-Count', events.length);
    res.json(events);
  } catch (error) {
    console.error('Erreur dans getAllEvents:', error);
    res.status(500).json({ message: error.message });
  }
};

// Détail d'un événement
const getEventById = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérification si l'événement est publié ou si l'utilisateur a les droits
    if (!event.is_published && req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Accès non autorisé à cet événement' });
    }

    res.json(event);
  } catch (error) {
    console.error('Erreur dans getEventById:', error);
    res.status(500).json({ message: error.message });
  }
};

// Créer un nouvel événement
const createEvent = async (req, res) => {
  try {
    // Seuls admin et organizer peuvent créer des événements
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Non autorisé. Rôle admin ou organizer requis.' });
    }

    // Validation des données
    const { title, date, location, category } = req.body;
    if (!title || !date || !location || !category) {
      return res.status(400).json({ message: 'Tous les champs obligatoires sont requis' });
    }

    // Ajout de l'organizer_id si c'est un organizer qui crée
    const eventData = {
      ...req.body,
      organizer_id: req.user.role === 'organizer' ? req.user.id : req.body.organizer_id
    };

    const newEvent = await Event.createEvent(eventData);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Erreur dans createEvent:', error);
    res.status(500).json({ message: error.message });
  }
};

// Modifier un événement
const updateEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérification des permissions
    if (req.user.role !== 'admin' && 
        (req.user.role !== 'organizer' || event.organizer_id !== req.user.id)) {
      return res.status(403).json({ message: 'Non autorisé à modifier cet événement' });
    }

    const updatedEvent = await Event.updateEvent(eventId, req.body);
    res.json(updatedEvent);
  } catch (error) {
    console.error('Erreur dans updateEvent:', error);
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un événement
const deleteEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérification des permissions
    if (req.user.role !== 'admin' && 
        (req.user.role !== 'organizer' || event.organizer_id !== req.user.id)) {
      return res.status(403).json({ message: 'Non autorisé à supprimer cet événement' });
    }

    // Supprimer aussi les tickets associés
    await Ticket.deleteTicketsForEvent(eventId);
    await Event.deleteEvent(eventId);
    
    res.json({ message: 'Événement et tickets associés supprimés avec succès' });
  } catch (error) {
    console.error('Erreur dans deleteEvent:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les événements d'un organisateur
const getEventsByOrganizer = async (req, res) => {
  try {
    const organizerId = parseInt(req.params.organizerId);
    
    // Un user ne peut voir que ses propres événements non publiés
    if (req.user.role === 'user' && req.user.id !== organizerId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const events = await Event.findByOrganizerId(organizerId);
    res.json(events);
  } catch (error) {
    console.error('Erreur dans getEventsByOrganizer:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByOrganizer
};