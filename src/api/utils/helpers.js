import logger from '../../logger';
const crypto = require('crypto');

// const fs = require('fs');
// const path = require('path');
// const util = require('util');

// const readFile = util.promisify(fs.readFile);
// const unlink = util.promisify(fs.unlink);

// export const getBuffer = (image) => {
//   const filePath = path.join(__dirname, '../../../pictures/', image);
//   return readFile(filePath);
// };

// export const deleteFile = (image) => {
//   const filePath = path.join(__dirname, '../../../pictures/', image);
//   return unlink(filePath);
// };

export function tryParseJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (err) {
    return jsonString; // Return original string if parsing fails
  }
}

// Webhook helper functions starts here

export const isExpiredWebhook = (timestamp, expirationInSeconds,) => {
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime - parseInt(timestamp) > expirationInSeconds;
};

export function isValidWebhookSignature(body, timestamp, signature, secret) {
  const dataToSign = `${timestamp}.${JSON.stringify(body)}`;
  logger.info("dataToSign: ", dataToSign);

  // Generate the HMAC SHA-256 signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex');

  logger.info('expectedSignature: ', expectedSignature);

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature),
  );
}
// Webhook helper functions ends here