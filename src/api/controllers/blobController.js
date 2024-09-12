import { BlockBlobClient, BlobServiceClient } from '@azure/storage-blob';
import multer from 'multer';
import { handleError } from '../utils/helpers';

const sasToken = process.env.AZURE_BLOB_STORAGE_SAS_TOKEN;
const accountName = process.env.AZURE_BLOB_STORAGE_ACCOUNT_NAME;
const containerName = process.env.AZURE_BLOB_STORAGE_CONTAINER_NAME;

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

    // Create the blob name from pictureType and walletId
    const blobName = `${pictureType}-${walletId}`;

    // Get a blockBlobClient for the specified blob
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const uploadResult = await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });
    // console.log("uploadResult: ", uploadResult);

    // The URL for the uploaded image
    const imageUrl = blockBlobClient.url;

    res.status(200).json({ message: 'Image uploaded successfully', url: imageUrl });
  } catch (error) {
    handleError(res, error, "upload_profile_picture error");
  }
};

const delete_profile_picture = async (req, res) => {
  try {
    const blobName = req.params.blobName;

    if (!blobName) {
      return res.status(400).send('Missing the blobName.');
    }

    // Get a blockBlobClient for the specified blobs
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Delete the blob
    const deleteResult = await blockBlobClient.delete();
    // console.log("delete result: ", deleteResult);

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