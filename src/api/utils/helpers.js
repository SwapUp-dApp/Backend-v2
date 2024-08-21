const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);

export function tryParseJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (err) {
    return jsonString; // Return original string if parsing fails
  }
}

export const handleError = (res, err, message) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: `${message} -> ${err.message || err}`
  });
};

export const getBuffer = (image) => {
  const filePath = path.join(__dirname, '../../../pictures/', image);
  return readFile(filePath);
};

export const deleteFile = (image) => {
  const filePath = path.join(__dirname, '../../../pictures/', image);
  return unlink(filePath);
};