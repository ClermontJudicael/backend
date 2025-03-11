const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Récupérer tous les événements avec filtres
router.get('/', async (req, res) => {
  try {
    console.log('Route /api/events appelée avec les filtres:', req.query);
    
    const filters = {
      date: req.query.date,
      location: req.query.location,
      category: req.query.category,
      search: req.query.search
    };
    
    console.log('Filtres traités:', filters);
    const events = await Event.getAllEvents(filters);
    console.log('Événements trouvés:', events);
    
    res.json(events);
  } catch (error) {
    console.error('Erreur dans la route /api/events:', error);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Récupérer un événement spécifique
router.get('/:id', async (req, res) => {
  try {
    console.log('Route /api/events/:id appelée avec ID:', req.params.id);
    const event = await Event.getEventById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Erreur dans la route /api/events/:id:', error);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 