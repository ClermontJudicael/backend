const { body, param, query } = require('express-validator');
const moment = require('moment');

exports.createEventValidator = [
    body('title')
        .trim()
        .notEmpty().withMessage('Le titre est requis')
        .isLength({ max: 255 }).withMessage('Le titre ne doit pas dépasser 255 caractères'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('La description est trop longue'),

    body('date')
        .notEmpty().withMessage('La date est requise')
        .custom((value) => {
            if (!moment(value, moment.ISO_8601, true).isValid()) {
                throw new Error('Format de date invalide (ISO8601 requis)');
            }
            if (moment(value).isBefore(moment())) {
                throw new Error('La date doit être dans le futur');
            }
            return true;
        }),

    body('location')
        .trim()
        .notEmpty().withMessage('Le lieu est requis')
        .isLength({ max: 255 }).withMessage('Le lieu est trop long'),

    body('category')
        .trim()
        .notEmpty().withMessage('La catégorie est requise')
        .isIn(['musique', 'sport', 'art', 'culture', 'autre']).withMessage('Catégorie invalide'),

    body('max_attendees')
        .optional()
        .isInt({ min: 1 }).withMessage('Doit être un nombre positif')
];

exports.updateEventValidator = [
    param('id')
        .isInt().withMessage('ID invalide'),

    ...this.createEventValidator.map(validation =>
        validation.optional()
    )
];

exports.eventQueryValidator = [
    query('category')
        .optional()
        .trim()
        .isIn(['musique', 'sport', 'art', 'culture', 'autre']),

    query('upcoming')
        .optional()
        .isBoolean().toBoolean(),

    query('page')
        .optional()
        .isInt({ min: 1 }).toInt(),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).toInt()
];