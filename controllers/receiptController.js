const Receipt = require("../models/Receipts");
const generateQRCode = require("../services/qrGenerator");

exports.createReceipt = async (req, res) => {
    try {
        const { userId, ticketId, amount } = req.body;
        const qrCode = await generateQRCode(`Ticket ${ticketId} - User ${userId}`);

        const receipt = await Receipt.create({ userId, ticketId, qrCode, amount });

        res.status(201).json({ message: "Receipt generated", receipt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};