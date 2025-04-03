// multerConfig.js (ou dans votre fichier de routes)
const multer = require('multer');
const path = require('path');

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Dossier où les fichiers seront stockés
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Renommer le fichier
    }
});

// Initialiser multer avec la configuration de stockage
const upload = multer({ storage: storage });

module.exports = upload; // Exporter pour l'utiliser dans d'autres fichiers
