router.post('/', authenticateToken, async (req, res) => {
  console.log('Requête reçue:', {
    body: req.body,
    user: req.user
  });

  try {
    // Validation des permissions
    if (!['admin', 'organizer'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Action non autorisée pour votre rôle',
        code: 'UNAUTHORIZED_ROLE'
      });
    }

    // Validation des données
    const requiredFields = ['title', 'date', 'location', 'category'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Champs obligatoires manquants',
        missingFields,
        code: 'VALIDATION_ERROR'
      });
    }

    // Préparation des données
    const eventData = {
      ...req.body,
      organizer_id: req.user.role === 'organizer' ? req.user.id : req.body.organizer_id,
      is_published: req.body.is_published || false
    };

    // Création dans la base de données
    const newEvent = await Event.createEvent(eventData);
    
    if (!newEvent || !newEvent.id) {
      throw new Error('La création a échoué: aucune donnée retournée');
    }

    // Réponse formatée pour React Admin
    return res.status(201).json({
      data: {
        id: newEvent.id,
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        location: newEvent.location,
        category: newEvent.category,
        image_url: newEvent.image_url,
        image_alt: newEvent.image_alt,
        organizer_id: newEvent.organizer_id,
        max_attendees: newEvent.max_attendees,
        is_published: newEvent.is_published,
        created_at: newEvent.created_at,
        updated_at: newEvent.updated_at
      }
    });

  } catch (error) {
    console.error('Erreur complète:', error);
    
    let statusCode = 500;
    let errorMessage = 'Erreur serveur';
    let errorCode = 'SERVER_ERROR';

    if (error.code === '23503') {
      statusCode = 400;
      errorMessage = 'Organisateur invalide';
      errorCode = 'INVALID_ORGANIZER';
    } else if (error.code === '23502') {
      statusCode = 400;
      errorMessage = 'Données obligatoires manquantes';
      errorCode = 'MISSING_REQUIRED_FIELDS';
    }

    return res.status(statusCode).json({
      message: errorMessage,
      code: errorCode,
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
});