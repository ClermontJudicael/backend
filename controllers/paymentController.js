const Ticket = require("../models/Ticket");
const Receipt = require("../models/Receipts");
const generateQRCode = require("../services/qrGenerator");

exports.processPayment = async (req, res) => {
    try {
        const { userId, eventId, amount } = req.body;

        // Create ticket
        const ticket = await Ticket.create({ eventId, userId, status: "paid" });

        // Generate QR code
        const qrCode = await generateQRCode(`Ticket ${ticket.id} - User ${userId}`);

        // Create receipt
        await Receipt.create({ userId, ticketId: ticket.id, qrCode, amount });

        res.status(201).json({ message: "Payment successful", ticket });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};