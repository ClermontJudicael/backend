const QRCode = require('qrcode');

async function generateQRCode(text) {
    try {
        return await QRCode.toDataURL(text);
    } catch (err) {
        console.error(err);
        return null;
    }
}

module.exports = generateQRCode;