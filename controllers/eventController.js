const Event = require('../models/Event');
const Ticket = require('../models/Ticket');


// Liste de tous les événements
const getAllEvents = async (req, res) => {
  try {
    // Récupération des paramètres
    const filters = {
      ...(req.query.filter ? JSON.parse(req.query.filter) : {}),
      ...req.query
    };

    // Pagination (React-Admin compatible)
    const range = req.query.range ? JSON.parse(req.query.range) : [0, 9];
    const [start, end] = range;
    const perPage = end - start + 1;
    const page = Math.floor(start / perPage) + 1;

    // Filtrage automatique pour les non-admins
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      filters.is_published = true;
    }

    const { events, total } = await Event.getAllEvents(filters, page, perPage);
    
    res.set('Content-Range', `events ${start}-${end}/${total}`);
    res.set('X-Total-Count', total);
    res.json(events);
  } catch (error) {
    console.error('Erreur dans getAllEvents:', error);
    res.status(500).json({ message: error.message });
  }
};

// Liste des événements filtrés par statut (accès public)
const getEventsByStatus = async (req, res) => {
  try {
    // Récupération des paramètres
    const filters = {
      ...(req.query.filter ? JSON.parse(req.query.filter) : {}),
      ...req.query
    };

    // Pagination (React-Admin compatible)
    const range = req.query.range ? JSON.parse(req.query.range) : [0, 9];
    const [start, end] = range;
    const perPage = end - start + 1;
    const page = Math.floor(start / perPage) + 1;

    // Filtrage automatique pour les non-admins/non-organizers/non-authentifiés
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'organizer')) {
      // On force le statut "published" pour les utilisateurs non privilégiés
      filters.status = 'published';
    } else if (!filters.status) {
    }

    // Appel à la méthode du modèle
    const events = await Event.getEventsByStatus(filters);
    const total = events.length;

    // Gestion de la pagination
    const paginatedEvents = events.slice(start, end + 1);
    
    // Headers pour React-Admin
    res.set('Content-Range', `events ${start}-${Math.min(end, total - 1)}/${total}`);
    res.set('X-Total-Count', total);
    
    res.json(paginatedEvents);
  } catch (error) {
    console.error('Erreur dans getEventsByStatus:', error);
    res.status(500).json({ 
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
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

    // AJOUT: Récupération des tickets associés à l'événement
    const tickets = await Ticket.findByEventId(eventId); // Supposant que cette méthode existe dans votre modèle Ticket

    // AJOUT: Fusion des données de l'événement avec les tickets
    const responseData = {
      ...event,
      tickets: tickets || [] // Retourne un tableau vide si aucun ticket
    };

    res.json(responseData);
  } catch (error) {
    console.error('Erreur dans getEventById:', error);
    res.status(500).json({ message: error.message });
  }
};

// Créer un nouvel événement
const createEvent = async (req, res) => {
  try {
    // Vérification des rôles
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Non autorisé. Rôle admin ou organizer requis.' });
    }

    // Validation des données
    const { title, date, location, category } = req.body;
    if (!title || !date || !location || !category) {
      return res.status(400).json({ message: 'Tous les champs obligatoires sont requis' });
    }

    // Ajout de l'organizer_id
    const eventData = {
      ...req.body,
      organizer_id: req.user.role === 'organizer' ? req.user.id : req.body.organizer_id
    };

    console.log('Données de l\'événement à créer:', eventData); // Log des données à créer

    const newEvent = await Event.createEvent(eventData);
    
    console.log('Événement créé:', newEvent); // Log de l'événement créé

    // Réponse avec la structure attendue
    console.log('Événement créé:', newEvent);
    res.status(201).json({ data: newEvent });
  } catch (error) {
    console.error('Erreur dans createEvent:', error);
    res.status(500).json({ message: error.message });
  }
};




const updateEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await Event.getEventById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérification des permissions
    if (req.user.role !== 'admin' && 
        (req.user.role !== 'organizer' || event.organizer_id !== req.user.id)) {
      return res.status(403).json({ message: 'Non autorisé à modifier cet événement' });
    }

    const updatedEvent = await Event.updateEvent(eventId, req.body);
    
    // LOG CRITIQUE - Vérifiez les données avant envoi
    console.log('🟢 [Controller] Données avant envoi:', { 
      originalData: updatedEvent,
      formattedData: { data: updatedEvent } 
    });

    res.json({ data: updatedEvent });
    
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

// recupere les tickets dans une evenements
const getEventTickets = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const tickets = await Ticket.findByEventId(eventId);
    res.json(tickets);
  } catch (error) {
    console.error('Erreur dans getEventTickets:', error);
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByOrganizer,
  getEventTickets, 
  getEventsByStatus
};