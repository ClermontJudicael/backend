exports.healthCheck = (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected', // Vous pourriez vérifier la connexion DB ici
        version: '1.0.0'
    });
};