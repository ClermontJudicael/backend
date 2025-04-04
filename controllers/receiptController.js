const Receipt = require("../models/Receipts");
const generateQRCode = require("../services/qrGenerator");

exports.createReceipt = async (req, res) => {
    try {
        const { userId, ticketId, amount } = req.body;
        const qrCode = await generateQRCode(`Ticket ${ticketId} - User ${userId}`);

        const receipt = await Receipt.create({
            userId,
            ticketId,
            qrCode,
            amount,
            paymentMethod: req.body.paymentMethod || 'credit_card',
            paymentStatus: 'completed'
        });

        res.status(201).json({ message: "Receipt generated", receipt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getReceiptById = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('SELECT * FROM receipts WHERE id = $1', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Receipt not found" });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getReceiptsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`Fetching receipts for user ${userId}`); // Debugging line
        const { rows } = await pool.query(
            'SELECT * FROM receipts WHERE user_id = $1 ORDER BY issued_at DESC',
            [userId]
        );
        console.log(`Received rows:`, rows); // Debugging line
        
        if (rows.length === 0) {
            console.log(`No receipts found for user ${userId}`); // Debugging line
            return res.status(404).json({ error: 'No receipts found for this user' });
        }
        
        res.json(rows); // Send the receipts data back
    } catch (error) {
        console.error('Error fetching receipts:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getReceiptByReservation = async (req, res) => {
    try {
        const { reservationId } = req.params;

        const result = await pool.query(
            'SELECT * FROM receipts WHERE reservation_id = $1',
            [reservationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Receipt not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};