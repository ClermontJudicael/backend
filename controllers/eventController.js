// const createEvent = async (req, res) => {
//     try {
//       // Validation requise des champs
//       const requiredFields = ['title', 'description', 'date', 'location', 'category'];
//       for (const field of requiredFields) {
//         if (!req.body[field]) {
//           return res.status(400).json({
//             error: `Le champ ${field} est requis`
//           });
//         }
//       }
  
//       // Validation du format de la date (au cas où ce ne serait pas fait en amont)
//       const eventDate = new Date(req.body.date);
//       if (isNaN(eventDate.getTime())) {
//         return res.status(400).json({
//           error: 'La date fournie n\'est pas valide'
//         });
//       }
  
//       // Création de l'événement avec l'organisateur approprié
//       const eventData = {
//         ...req.body,
//         organizer_id: req.user.role === 'organizer' ? req.user.id : req.body.organizer_id,
//         status: req.body.status || 'draft' // Valeur par défaut pour le statut
//       };
  
//       // Création de l'événement dans la base de données
//       const newEvent = await Event.createEvent(eventData);
  
//       // Formatage strict pour React Admin (si besoin d'intégrer avec un front-end particulier)
//       res.status(201).json({
//         data: {
//           id: newEvent.id, // Identifiant obligatoire
//           title: newEvent.title,
//           description: newEvent.description,
//           date: newEvent.date,
//           location: newEvent.location,
//           category: newEvent.category,
//           image_url: newEvent.image_url || null, // Lien de l'image s'il existe
//           image_alt: newEvent.image_alt || null, // Texte alternatif pour l'image
//           organizer_id: newEvent.organizer_id,
//           status: newEvent.status,
//           created_at: newEvent.created_at,
//           updated_at: newEvent.updated_at
//         }
//       });
  
//     } catch (error) {
//       // Log de l'erreur pour un debug plus facile
//       console.error('Erreur lors de la création de l\'événement:', {
//         error: error.message,
//         body: req.body,
//         user: req.user
//       });
  
//       // Retour d'une erreur générique en cas d'échec
//       res.status(500).json({
//         error: "Erreur lors de la création de l'événement",
//         ...(process.env.NODE_ENV === 'development' && { details: error.message }) // Affichage détaillé en dev
//       });
//     }
//   };
  