import { BlobServiceClient } from '@azure/storage-blob';
import multer from 'multer';
import { tryParseJSON } from '../utils/helpers';
import db from '../../database/models';
import { SUE_BlobPictureType } from '../utils/constants';
import Environment from '../../config';
import logger from '../../logger';
import { handleError } from '../../errors';

const sasToken = Environment.AZURE_BLOB_STORAGE_SAS_TOKEN;
const accountName = Environment.AZURE_BLOB_STORAGE_ACCOUNT_NAME;
const containerName = Environment.AZURE_BLOB_STORAGE_CONTAINER_NAME;

const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net/?${sasToken}`);
const containerClient = blobServiceClient.getContainerClient(containerName);

// multer for file upload handling
const upload = multer({ storage: multer.memoryStorage() });

const upload_profile_picture = async (req, res) => {
  try {
    const { pictureType, walletId } = req.body;

    if (!req.file || !pictureType || !walletId) {
      return res.status(400).send('Missing file, picture type, or wallet ID.');
    }

    // Find the user by walletId in the Users table
    const user = await db.users.findOne({ where: { wallet: walletId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Create the blob name from pictureType and walletId
    const blobName = `${pictureType}-${walletId}`;

    // Get a blockBlobClient for the specified blob
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const uploadResult = await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });
    // logger.info("uploadResult: ", uploadResult);

    // The URL for the uploaded image
    const imageUrl = blockBlobClient.url;

    // Parse the existing images column (use tryParseJSON)
    let images = tryParseJSON(user.images);

    // Ensure the images object has both avatar and coverImage keys
    if (!images.avatar) images.avatar = '';
    if (!images.coverImage) images.coverImage = '';

    // Update either the avatar or coverImage based on pictureType
    if (pictureType === SUE_BlobPictureType.AVATAR) {
      images.avatar = imageUrl;
    }

    if (pictureType === SUE_BlobPictureType.COVER) {
      images.coverImage = imageUrl;
    }

    // Update the user's images column
    await db.users.update(
      { images: JSON.stringify(images) },
      { where: { wallet: walletId } }
    );

    res.status(200).json({ message: 'Image uploaded successfully', url: imageUrl });
  } catch (error) {
    handleError(res, error, "upload_profile_picture error");
  }
};

const delete_profile_picture = async (req, res) => {
  try {
    const { pictureType, walletId } = req.body;

    if (!pictureType || !walletId) {
      return res.status(400).send('Missing picture type, or wallet ID.');
    }

    // Find the user by walletId in the Users table
    const user = await db.users.findOne({ where: { wallet: walletId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Create the blob name from pictureType and walletId
    const blobName = `${pictureType}-${walletId}`;

    // Get a blockBlobClient for the specified blobs
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Delete the blob
    const deleteResult = await blockBlobClient.delete();
    // logger.info("delete result: ", deleteResult);

    // Parse the existing images column (use tryParseJSON)
    let images = tryParseJSON(user.images);

    // Update either the avatar or coverImage based on pictureType
    if (pictureType === SUE_BlobPictureType.AVATAR) {
      images.avatar = '';
    }

    if (pictureType === SUE_BlobPictureType.COVER) {
      images.coverImage = '';
    }

    // Update the user's images column
    await db.users.update(
      { images: JSON.stringify(images) },
      { where: { wallet: walletId } }
    );

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    handleError(res, error, "delete_profile_picture error");
  }
};

export const blobController = {
  upload_middleware: upload.single('file'), // multer middleware for single file upload
  upload_profile_picture,
  delete_profile_picture
};