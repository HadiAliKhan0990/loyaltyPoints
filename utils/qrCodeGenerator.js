const QRCode = require('qrcode');
const { encryptData } = require('./encryption');

/**
 * Generate a QR code data URL for a ticket
 * @param {Object} ticketData - The ticket data to encode in the QR code
 * @returns {Promise<string>} - A promise that resolves to the QR code data URL
 */
const generateTicketQRCode = async (ticketData) => {
  try {
    // Extract only the necessary data for the QR code
    const qrPayload = {
      ticketCode: ticketData.ticketCode,
      name: ticketData.name,
      companyName: ticketData.companyName,
      product: ticketData.product,
      expiryDate: ticketData.expiryDate
    };

    // Encrypt the payload before generating QR code
    const encryptedPayload = encryptData(qrPayload);

    // Generate the QR code with high error correction
    const qrCode = await QRCode.toDataURL(encryptedPayload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    return qrCode;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

module.exports = {
  generateTicketQRCode
}; 