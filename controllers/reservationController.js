const Reservation = require('../models/Reservation');
 const Ticket = require('../models/Ticket');
 const Event = require('../models/Event');
 const User = require('../models/User');
 const { Pool } = require('pg');
const { get } = require('../authRoutes');
 const pool = new Pool({
   connectionString: process.env.DATABASE_URL,
 });
 
 // Liste de toutes les réservations (admin uniquement)
 const getAllReservations = async (req, res) => {
   try {
     if (req.user.role !== 'admin') {
       return res.status(403).json({ message: 'Non autorisé' });
     }
 
     // Récupérer toutes les réservations
     const allReservations = await Reservation.getAllReservations();
 
     // Ajouter des détails sur les tickets et événements
     const detailedReservations = await Promise.all(allReservations.map(async (reservation) => {
       const ticket = await Ticket.findById(reservation.ticket_id);
       let event = null;
       if (ticket) {
         event = await Event.getEventById(ticket.event_id);
       }
 
       return {
         ...reservation,
         ticket_details: ticket,
         event_details: event
       };
     }));
 
     res.set('Content-Range', `reservations 0-${detailedReservations.length-1}/${detailedReservations.length}`);
     res.set('X-Total-Count', detailedReservations.length);
     res.json(detailedReservations);
   } catch (error) {
     console.error('Erreur dans getAllReservations:', error);
     res.status(500).json({ message: error.message });
   }
 };
 
 // Réservations par événement
 const getReservationsByEventId = async (req, res) => {
   try {
     const eventId = parseInt(req.params.id);
 
     // Vérifier que l'utilisateur a le droit de voir ces réservations
     if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
       return res.status(403).json({ message: 'Non autorisé' });
     }
 
     // À implémenter: requête SQL pour récupérer les réservations
     // Pour le moment, renvoie un tableau vide
     const reservations = [];
 
     res.set('Content-Range', `reservations 0-${reservations.length-1}/${reservations.length}`);
     res.set('X-Total-Count', reservations.length);
     res.json(reservations);
   } catch (error) {
     console.error('Erreur getReservationsByEventId:', error);
     res.status(500).json({ message: error.message });
   }
 };
 
 // Réservations d'un utilisateur
 const getReservationsByUserId = async (req, res) => {
   try {
     const userId = parseInt(req.params.id);
 
     // Les utilisateurs ne peuvent voir que leurs propres réservations, sauf les admins
     if (req.user.role !== 'admin' && req.user.id !== userId) {
       return res.status(403).json({ message: 'Non autorisé' });
     }
 
     const userReservations = await Reservation.getReservationsByUserId(userId);
 
     // Ajouter des détails sur les tickets et événements
     const detailedReservations = await Promise.all(userReservations.map(async (reservation) => {
       const ticket = await Ticket.findById(reservation.ticket_id);
       let event = null;
       if (ticket) {
         event = await Event.getEventById(ticket.event_id);
       }
 
       return {
         ...reservation,
         ticket_details: ticket,
         event_details: event
       };
     }));
 
     res.set('Content-Range', `reservations 0-${detailedReservations.length-1}/${detailedReservations.length}`);
     res.set('X-Total-Count', detailedReservations.length);
     res.json(detailedReservations);
   } catch (error) {
     console.error('Erreur dans getReservationsByUserId:', error);
     res.status(500).json({ message: error.message });
   }
 };



 const getConfirmedReservations = async (req, res) => {
   try {
     if (req.user.role !== 'admin') {
       return res.status(403).json({ message: 'Non autorisé' });
     }
 
     // Récupérer les paramètres de pagination
     const page = parseInt(req.query.page) || 1;
     const perPage = parseInt(req.query.perPage) || 10;
 
     // Récupérer toutes les réservations confirmées avec pagination
     const confirmedReservations = await Reservation.getAllReservations({
       status: 'confirmed',
       page,
       perPage
     });
 
     // Comptez le nombre total de réservations confirmées
     const totalConfirmed = await Reservation.countReservations({ status: 'confirmed' });
 
     // Définissez l'en-tête Content-Range
     res.set('Content-Range', `reservations ${(page - 1) * perPage}-${(page * perPage) - 1}/${totalConfirmed}`);
     res.set('X-Total-Count', totalConfirmed);
 
     // Renvoie les réservations confirmées
     res.json(confirmedReservations);
   } catch (error) {
     console.error('Erreur dans getConfirmedReservations:', error);
     res.status(500).json({ message: error.message });
   }
 };
 
 const cancelReservation = async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id);
    console.log(`Tentative d'annulation de la réservation avec ID: ${reservationId}`);
    
    const reservation = await Reservation.findById(reservationId);
    console.log('Réservation trouvée:', reservation);

    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Vérifier les autorisations
    if (req.user.role !== 'admin' && req.user.id !== reservation.user_id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Mettre à jour le statut de la réservation
    const updatedReservation = await Reservation.cancelReservation(reservationId);
    console.log('Réservation mise à jour:', updatedReservation);

    // Augmenter la quantité disponible du ticket
    const ticket = await Ticket.findById(reservation.ticket_id);
    console.log('Ticket trouvé:', ticket);

    if (ticket) {
      console.log('Quantité disponible avant mise à jour:', ticket.available_quantity);
      console.log('Quantité à ajouter:', reservation.quantity);
      
      const newAvailableQuantity = ticket.available_quantity + reservation.quantity;
      console.log('Nouvelle quantité disponible:', newAvailableQuantity);

      await Ticket.updateTicketQuantity(ticket.id, newAvailableQuantity);
    } else {
      console.log('Aucun ticket trouvé pour cette réservation.');
    }

    res.json(updatedReservation);
  } catch (error) {
    console.error('Erreur dans cancelReservation:', error);
    res.status(500).json({ message: error.message });
  }
};


 const getOneReservation = async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id);
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Autorisation : admin ou propriétaire de la réservation
    if (req.user.role !== 'admin' && req.user.id !== reservation.user_id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Récupère les détails associés
    const ticket = await Ticket.findById(reservation.ticket_id);
    let event = null;
    if (ticket) {
      event = await Event.getEventById(ticket.event_id);
    }

    res.json({
      ...reservation,
      ticket_details: ticket,
      event_details: event
    });

  } catch (error) {
    console.error('Erreur dans getOneReservation:', error);
    res.status(500).json({ message: error.message });
  }
};

// Dans reservationController.js
const processPayment = async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id);
    const { paymentMethod } = req.body;

    // 1. Vérifier la réservation
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // 2. Vérifier les autorisations
    if (req.user.id !== reservation.user_id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // 3. Confirmer la réservation
    const updatedReservation = await Reservation.updateStatus(reservationId, 'confirmed');

    // 4. Récupérer les détails du ticket et de l'événement
    const ticket = await Ticket.findById(reservation.ticket_id);
    const event = await Event.getEventById(ticket.event_id);

    // 5. Créer un reçu
    const receiptData = {
      reservation_id: reservationId,
      user_id: reservation.user_id,
      ticket_id: reservation.ticket_id,
      qr_code: `qr-${reservationId}-${Date.now()}`, // À remplacer par une vraie génération de QR code
      amount: ticket.price * reservation.quantity,
      payment_method: paymentMethod,
      payment_status: 'completed'
    };

    // 6. Insérer le reçu dans la base de données
    const receipt = await pool.query(
        'INSERT INTO receipts (reservation_id, user_id, ticket_id, qr_code, amount, payment_method, payment_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [
          receiptData.reservation_id,
          receiptData.user_id,
          receiptData.ticket_id,
          receiptData.qr_code,
          receiptData.amount,
          receiptData.payment_method,
          receiptData.payment_status
        ]
    );

    res.json({
      success: true,
      reservation: updatedReservation,
      receipt: receipt.rows[0],
      event,
      ticket
    });
  } catch (error) {
    console.error('Erreur de paiement:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Dans reservationController.js
const createReservation = async (req, res) => {
  try {
    const { eventId, ticketId, quantity } = req.body;
    const userId = req.user.id;

    // Validation
    if (!ticketId || !quantity) {
      return res.status(400).json({ message: 'Données manquantes' });
    }

    // Vérifier le ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }

    // Vérifier la quantité disponible
    if (ticket.available_quantity < quantity) {
      return res.status(400).json({
        message: `Seulement ${ticket.available_quantity} tickets disponibles`
      });
    }

    // Créer la réservation
    const result = await pool.query(
        `INSERT INTO reservations (user_id, ticket_id, quantity, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
        [userId, ticketId, quantity]
    );

    // Mettre à jour la quantité disponible
    const newQuantity = ticket.available_quantity - quantity;
    await Ticket.updateQuantity(ticketId, newQuantity);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur création réservation:', error);
    res.status(500).json({
      message: 'Erreur serveur',
      error: error.message
    });
  }
};
 module.exports = {
   getAllReservations,
   getReservationsByEventId,
   getReservationsByUserId,
   cancelReservation,
   getConfirmedReservations,
   getOneReservation,
   processPayment,
   createReservation
 };