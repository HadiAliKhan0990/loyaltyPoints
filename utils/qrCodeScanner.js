const { decryptData } = require('./encryption');

/**
 * Process and decrypt QR code data
 * @param {string} qrCodeData - The data scanned from the QR code
 * @returns {Object} - The decrypted ticket data
 */
const processQRCodeData = (qrCodeData) => {
  try {
    // Decrypt the QR code data
    const decryptedData = decryptData(qrCodeData);
    return decryptedData;
  } catch (error) {
    console.error('Error processing QR code data:', error);
    throw new Error('Failed to process QR code data');
  }
};

module.exports = {
  processQRCodeData
}; 