const { body, param } = require('express-validator');

exports.createReceiptValidator = [
    body('reservationId')
        .isInt({ min: 1 }).withMessage('ID de réservation invalide'),

    body('userId')
        .isInt({ min: 1 }).withMessage('ID utilisateur invalide'),

    body('ticketId')
        .isInt({ min: 1 }).withMessage('ID billet invalide'),

    body('amount')
        .isFloat({ min: 0 }).withMessage('Montant invalide'),

    body('paymentMethod')
        .optional()
        .isIn(['credit_card', 'paypal', 'transfer', 'cash']).withMessage('Méthode de paiement invalide')
];

exports.receiptParamsValidator = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID de reçu invalide')
];