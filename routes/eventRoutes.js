const express = require("express");
const router = express.Router();
const Event = require('../models/Event');
const multer = require('multer');
const upload = require('../config/multerConfig');
const path = require('path');
const fs = require('fs');
const ticketController = require('../controllers/ticketController');
const reservationController = require('../controllers/reservationController');
const { authenticateToken } = require('../authMiddleware');
const eventController = require('../controllers/eventController');


// Vérifiez si ticketController est bien importé
console.log("ticketController:", ticketController);

/*
// Configuration de Multer pour gérer les uploads d'images
const uploadDir = path.join(__dirname, "../images/events");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});


const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // limite à 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Le fichier doit être une image"), false);
    }
  },
});

// Route pour l'upload d'image d'un événement
router.post(
  "/:id/image",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "organizer") {
        return res.status(403).json({ message: "Non autorisé" });
      }

      const eventId = parseInt(req.params.id);
      const event = await Event.getEventById(eventId);

      if (!event) {
        return res.status(404).json({ message: "Événement non trouvé" });
      }

      // Si l'utilisateur est un organisateur, vérifier que c'est son événement
      if (req.user.role === "organizer" && event.organizer_id !== req.user.id) {
        return res.status(403).json({
          message: "Vous ne pouvez modifier que vos propres événements",
        });
      }

      // Si un fichier a été uploadé
      if (req.file) {
        // Mettre à jour l'URL de l'image dans l'événement
        const imageUrl = `/images/events/${req.file.filename}`;

        // Ici il faudrait mettre à jour l'événement dans la BDD
        // Vous devrez ajouter une méthode updateEvent dans votre modèle Event
        // Pour l'instant, on simule simplement une réponse

        res.json({ imageUrl });
      } else {
        res.status(400).json({ message: "Aucune image fournie" });
      }
    } catch (error) {
      console.error("Erreur dans l'upload d'image:", error);
      res.status(500).json({ message: error.message });
    }
  }
);*/

// Récupérer les 6 derniers events
router.get("/last-date", async (req, res) => {
  try {
    const events = await Event.getLastDateEvents();
    console.log("Événements trouvés:", events);

    // Définir l'en-tête Content-Range
    res.set("Content-Range", `events 0-${events.length - 1}/${events.length}`);
    res.set("X-Total-Count", events.length);
    res.json(events);
  } catch (error) {
    console.error("Erreur dans la route /api/events:", error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Récupérer un événement spécifique par son ID
router.get("/:id", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await Event.getEventById(eventId);

    if (!event) {
      return res.status(404).json({
        error: "Not Found",
        message: `Event with ID ${eventId} not found`,
      });
    }


    // Ajoute les headers cohérents avec vos autres endpoints
    res.set("Content-Range", `events 0-1/1`);
    res.set("X-Total-Count", "1");

    res.json(event);
  } catch (error) {
    console.error(`Error fetching event ${req.params.id}:`, error);
    res.status(500).json({
      error: "Server Error",
      message: "An error occurred while fetching the event",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
});





/*
// Route pour changer le statut d'un événement
router.put("/:id/status", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "organizer") {
      return res.status(403).json({ message: "Non autorisé" });
    }

    const eventId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || !["draft", "published", "canceled"].includes(status)) {
      return res.status(400).json({
        message: "Statut invalide. Doit être: draft, published ou canceled",
      });
    }

    const event = await Event.getEventById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé" });
    }

    // Si l'utilisateur est un organisateur, vérifier que c'est son événement
    if (req.user.role === "organizer" && event.organizer_id !== req.user.id) {
      return res.status(403).json({
        message: "Vous ne pouvez modifier que vos propres événements",
      });
    }

    // Ici il faudrait mettre à jour l'événement dans la BDD
    // Vous devrez ajouter une méthode updateEventStatus dans votre modèle Event
    // Pour l'instant, on simule simplement une réponse

    res.json({ ...event, status });
  } catch (error) {
    console.error("Erreur dans la mise à jour du statut:", error);
    res.status(500).json({ message: error.message });
  }
});
*/

// Routes pour les tickets d'un événement
console.log("getTicketsByEventId:", ticketController.getTicketsByEventId); // Vérifiez ici
if (typeof ticketController.getTicketsByEventId !== "function") {
  throw new Error("getTicketsByEventId is not a function");
}
router.get('/:eventId/tickets', authenticateToken, ticketController.getTicketsByEventId);


// Routes pour les réservations d'un événement
router.get(
  "/:id/reservations",
  authenticateToken,
  reservationController.getReservationsByEventId
);


// Récupérer tous les événements avec filtres
router.get("/", async (req, res) => {
  try {
    console.log("Route /api/events appelée avec les filtres:", req.query);

    const filters = {
      date: req.query.date,
      location: req.query.location,
      category: req.query.category,
      search: req.query.search,
    };

    console.log("Filtres traités:", filters);
    const events = await Event.getAllEvents(filters);
    console.log("Événements trouvés filter:", events);

    // Définir l'en-tête Content-Range
    res.set("Content-Range", `events 0-${events.length - 1}/${events.length}`);
    res.set("X-Total-Count", events.length);
    res.json(events);
  } catch (error) {
    console.error("Erreur dans la route /api/events:", error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});


// Créer un événement
router.post('/', authenticateToken, upload.single('image') ,async (req, res) => {
  try {
    console.log('Fichier reçu:', req.file); // <-- Ajout important
    console.log('Corps de la requête:', req.body);
    // Vérification des rôles
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Validation des données
    const { title, description, date, location, category, status, image_alt } = req.body;
    if (!title || !date || !location || !category) {
      return res.status(400).json({ message: 'Tous les champs obligatoires sont requis' });
    }

    // Ajout de l'organizer_id si c'est un organizer qui crée
    const eventData = {
      title,
      description,
      date,
      location,
      category,
      status,
      image_url: req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null,
      image_alt: image_alt || null,
      organizer_id: req.user.role === 'organizer' ? req.user.id : req.body.organizer_id
    };

    // Appel à la méthode createEvent du modèle
    const newEvent = await Event.createEvent(eventData);

    // Réponse avec la structure attendue
    console.log("Réponse envoyée au frontend :", { data: newEvent });
    res.status(201).json({ data: newEvent });
  } catch (error) {
    console.error('Erreur complète:', error);
    console.error('Erreur dans la création d\'événement:', error);
    res.status(500).json({ message: error.message });
  }
});

/*
// Modifier un événement
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "organizer") {
      return res.status(403).json({ message: "Non autorisé" });
    }

    const eventId = parseInt(req.params.id);
    const event = await Event.getEventById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé" });
    }

    // Si l'utilisateur est un organisateur, vérifier que c'est son événement
    if (req.user.role === "organizer" && event.organizer_id !== req.user.id) {
      return res.status(403).json({
        message: "Vous ne pouvez modifier que vos propres événements",
      });
    }

    // Mettre à jour l'événement
    // Vous devrez ajouter une méthode updateEvent dans votre modèle Event

    res.json({ message: "Mise à jour d'événement à implémenter" });
  } catch (error) {
    console.error("Erreur dans la mise à jour d'événement:", error);
    res.status(500).json({ message: error.message });
  }
});
*/

// Supprimer un événement
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "organizer") {
      return res.status(403).json({ message: "Non autorisé" });
    }

    const eventId = parseInt(req.params.id);
    const event = await Event.getEventById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé" });
    }

    // Si l'utilisateur est un organisateur, vérifier que c'est son événement
    if (req.user.role === "organizer" && event.organizer_id !== req.user.id) {
      return res.status(403).json({
        message: "Vous ne pouvez supprimer que vos propres événements",
      });
    }

    // Supprimer l'événement
    await Event.deleteEvent(eventId); // Appeler la méthode de suppression

    // Répondre avec un statut 204 No Content
    res.status(204).send(); // Pas de contenu à renvoyer
  } catch (error) {
    console.error("Erreur dans la suppression d'événement:", error);
    res.status(500).json({ message: error.message });
  }
});


router.put('/:id', authenticateToken, eventController.updateEvent);


// Route à ajouter
router.get('/filter/by-status', eventController.getEventsByStatus);

module.exports = router;
