import { BlockBlobClient, BlobServiceClient } from '@azure/storage-blob';
import multer from 'multer';
import { handleError } from '../utils/helpers';

const sasToken = process.env.AZURE_BLOB_STORAGE_SAS_TOKEN;
const accountName = process.env.AZURE_BLOB_STORAGE_ACCOUNT_NAME;
const containerName = process.env.AZURE_BLOB_STORAGE_CONTAINER_NAME;



// multer for file upload handling
const upload = multer({ storage: multer.memoryStorage() });

const upload_profile_picture = async (req, res) => {
  try {
    const { pictureType, walletId } = req.body;

    if (!req.file || !pictureType || !walletId) {
      return res.status(400).send('Missing file, picture type, or wallet ID.');
    }

    // const originalFileName = req.file.originalname;
    // const sasUrl = process.env.AZURE_BLOB_STORAGE_SAS_URL;

    const blobName = `${pictureType}-${walletId}`;
    // const blobUrl = `${sasUrl}/${blobName}`;

    // const blockBlobClient = new BlockBlobClient(blobUrl);
    const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net/?${sasToken}`);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    console.log("blockBlobClient: ", blockBlobClient);

    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    res.status(200).json({ message: 'Image uploaded successfully', url: `${containerClient.url}/${blobName}` });
  } catch (error) {
    handleError(res, error, "upload_profile_picture error");
  }
};


export const blobController = {
  upload_middleware: upload.single('file'), // multer middleware for single file upload
  upload_profile_picture
};