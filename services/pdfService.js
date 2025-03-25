const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { formatDate } = require('.//helpers');

class PdfService {
    constructor() {
        this.templatesDir = path.join(__dirname, '../../templates');
    }

    async generateReceipt(receiptData, userData, eventData, ticketData) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ size: 'A4', margin: 50 });
                const buffers = [];
                const filename = `receipt_${receiptData.id}.pdf`;
                const filepath = path.join(__dirname, '../../public/receipts', filename);

                // Stockage en mémoire
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    fs.writeFileSync(filepath, pdfData);
                    resolve({ buffer: pdfData, filepath });
                });

                // Header
                this._addHeader(doc, eventData);

                // Contenu principal
                this._addReceiptDetails(doc, receiptData, userData, ticketData);

                // Footer
                this._addFooter(doc);

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    _addHeader(doc, event) {
        // Logo (à adapter selon votre structure)
        doc.image(path.join(this.templatesDir, 'logo.png'), 50, 45, { width: 50 });

        doc
            .fontSize(20)
            .text('CONFIRMATION DE RÉSERVATION', { align: 'center' })
            .moveDown(0.5);

        doc
            .fontSize(16)
            .text(event.title, { align: 'center' })
            .fontSize(12)
            .text(`${formatDate(event.date)} | ${event.location}`, { align: 'center' })
            .moveDown(2);
    }

    _addReceiptDetails(doc, receipt, user, ticket) {
        doc
            .fontSize(14)
            .text('Détails du reçu', { underline: true })
            .moveDown(0.5);

        // Tableau des informations
        const startY = doc.y;

        doc
            .font('Helvetica-Bold')
            .text('Référence:', 50, startY)
            .font('Helvetica')
            .text(receipt.id, 200, startY)
            .moveDown(0.5);

        doc
            .font('Helvetica-Bold')
            .text('Date:', 50)
            .font('Helvetica')
            .text(formatDate(receipt.issued_at), 200)
            .moveDown(0.5);

        doc
            .font('Helvetica-Bold')
            .text('Billet:', 50)
            .font('Helvetica')
            .text(`${ticket.type} (${ticket.price}€)`, 200)
            .moveDown(0.5);

        doc
            .font('Helvetica-Bold')
            .text('Montant total:', 50)
            .font('Helvetica')
            .text(`${receipt.amount}€`, 200)
            .moveDown(2);

        // Informations utilisateur
        this._addUserSection(doc, user);
    }

    _addUserSection(doc, user) {
        doc
            .fontSize(14)
            .text('Informations participant', { underline: true })
            .moveDown(0.5);

        doc
            .font('Helvetica-Bold')
            .text('Nom:', 50)
            .font('Helvetica')
            .text(user.username, 200)
            .moveDown(0.5);

        doc
            .font('Helvetica-Bold')
            .text('Email:', 50)
            .font('Helvetica')
            .text(user.email, 200)
            .moveDown(2);
    }

    _addFooter(doc) {
        const footerText = 'Merci pour votre réservation. Présentez ce reçu à l\'entrée de l\'événement.';

        doc
            .fontSize(10)
            .text(footerText, 50, doc.page.height - 100, {
                align: 'center',
                width: 500
            });

        doc
            .text('© 2023 EventApp - Tous droits réservés', {
                align: 'center',
                width: 500
            });
    }
}

module.exports = new PdfService();