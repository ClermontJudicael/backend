// backend/config/database.js
const { Pool } = require('pg');
const logger = require('../utils/logger');
require('dotenv').config();

// Configuration avancée du pool de connexions
const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    max: 20,                // Nombre max de clients
    min: 2,                 // Nombre min de clients
    idleTimeoutMillis: 30000, // Temps avant libération
    connectionTimeoutMillis: 5000 // Temps d'attente connexion
};

const pool = new Pool(poolConfig);

// Événements du pool
pool.on('connect', () => {
    logger.info('Nouvelle connexion DB établie');
});

pool.on('error', (err) => {
    logger.error('Erreur sur client PostgreSQL:', {
        error: err.message,
        stack: err.stack
    });
});

// Test de connexion au démarrage
(async () => {
    try {
        const client = await pool.connect();
        const { rows } = await client.query('SELECT NOW() as time, version() as version');
        logger.info('✅ Connecté à PostgreSQL:', {
            version: rows[0].version.split(' ')[1],
            time: rows[0].time
        });
        client.release();
    } catch (err) {
        logger.error('❌ Échec de connexion DB:', {
            error: err.message,
            code: err.code
        });
        process.exit(1);
    }
})();

// Interface du module
module.exports = {
    /**
     * Exécute une requête SQL
     * @param {string} text - Requête SQL
     * @param {Array} params - Paramètres
     * @returns {Promise<QueryResult>}
     */
    query: async (text, params) => {
        const start = Date.now();
        try {
            const result = await pool.query(text, params);
            const duration = Date.now() - start;
            logger.debug(`Requête exécutée (${duration}ms): ${text.substring(0, 50)}...`);
            return result;
        } catch (err) {
            logger.error('Erreur de requête:', {
                query: text,
                params,
                error: err.message,
                code: err.code
            });
            throw err;
        }
    },

    /**
     * Obtient un client dédié pour transactions
     * @returns {Promise<PoolClient>}
     */
    getClient: async () => {
        const client = await pool.connect();

        // Proxy pour tracer les requêtes
        const originalQuery = client.query;
        client.query = (...args) => {
            logger.debug(`Requête transactionnelle: ${args[0].substring(0, 50)}...`);
            return originalQuery.apply(client, args);
        };

        return client;
    },

    // Pour les fermetures propres
    close: async () => {
        await pool.end();
        logger.info('Pool PostgreSQL fermé');
    }
};