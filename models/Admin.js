const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateReceipt } = require('../middlewares/validators');

/**
 * @swagger
 * tags:
 *   name: Receipts
 *   description: Gestion des reçus de réservation
 */

/**
 * @swagger
 * /api/receipts:
 *   post:
 *     summary: Créer un reçu avec QR code
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Receipt'
 *     responses:
 *       201:
 *         description: Reçu généré avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */
router.post('/', authenticate, authorize(['admin', 'organizer']), validateReceipt, receiptController.createReceipt);

/**
 * @swagger
 * /api/receipts/user/{userId}:
 *   get:
 *     summary: Obtenir les reçus d'un utilisateur
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Liste des reçus
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/user/:userId', authenticate, receiptController.getUserReceipts);

/**
 * @swagger
 * /api/receipts/{id}:
 *   get:
 *     summary: Obtenir un reçu spécifique
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du reçu
 *     responses:
 *       200:
 *         description: Détails du reçu
 *       404:
 *         description: Reçu non trouvé
 *   delete:
 *     summary: Supprimer un reçu
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du reçu
 *     responses:
 *       204:
 *         description: Reçu supprimé
 *       404:
 *         description: Reçu non trouvé
 */
router.route('/:id')
    .get(authenticate, receiptController.getReceipt)
    .delete(authenticate, authorize(['admin']), receiptController.deleteReceipt);

/**
 * @swagger
 * /api/receipts/{id}/download:
 *   get:
 *     summary: Télécharger le PDF du reçu
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du reçu
 *     responses:
 *       200:
 *         description: Fichier PDF du reçu
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Reçu non trouvé
 */
router.get('/:id/download', authenticate, receiptController.downloadReceipt);

/**
 * @swagger
 * /api/receipts/{id}/qr:
 *   get:
 *     summary: Obtenir le QR code d'un reçu
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du reçu
 *     responses:
 *       200:
 *         description: Image du QR code
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Reçu non trouvé
 */
router.get('/:id/qr', authenticate, receiptController.getReceiptQrCode);

module.exports = router;