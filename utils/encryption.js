const CryptoJS = require('crypto-js');

// You should store this in environment variables in production
const SECRET_KEY = process.env.ENCRYPTION_KEY;

/**
 * Encrypt data using AES encryption
 * @param {Object} data - The data to encrypt
 * @returns {string} - The encrypted string
 */
const encryptData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data using AES decryption
 * @param {string} encryptedData - The encrypted string to decrypt
 * @returns {Object} - The decrypted data object
 */
const decryptData = (encryptedData) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

module.exports = {
  encryptData,
  decryptData
}; 