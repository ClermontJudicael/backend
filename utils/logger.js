const winston = require('winston');
const { combine, timestamp, printf, colorize } = winston.format;

// Configuration des transports (fichiers + console)
const transports = [
    new winston.transports.Console({
        level: 'debug',
        format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }))
    }),
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5 * 1024 * 1024 // 5MB
    }),
    new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 10 * 1024 * 1024 // 10MB
    })
];

// Format personnalisé
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

// Création du logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
        timestamp(),
        logFormat
    ),
    transports
});

// Pour les erreurs non catchées
process.on('unhandledRejection', (ex) => {
    logger.error(`UNHANDLED REJECTION: ${ex.message}`, ex);
});

module.exports = logger;