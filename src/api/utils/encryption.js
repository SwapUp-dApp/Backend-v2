import { DefaultAzureCredential, ClientSecretCredential, getDefaultAzureCredential } from "@azure/identity";
import { CryptographyClient, KeyClient } from "@azure/keyvault-keys";
import Environment from "../../config";


const generateAddressBuffer = async (address, isBase64 = false) => {
  try {
    const vaultUrl = `https://${Environment.AZURE_VAULT_NAME}.vault.azure.net`;
    const credential = new ClientSecretCredential(
      Environment.AZURE_VAULT_TENANT_ID,
      Environment.AZURE_VAULT_CLIENT_ID,
      Environment.AZURE_VAULT_CLIENT_SECRET
    );
    const keyClient = new KeyClient(vaultUrl, credential);
    const key = await keyClient.getKey(Environment.AZURE_VAULT_ENCRYPT_KEY_NAME);
    // Create a CryptographyClient to handle encryption
    const cryptoClient = new CryptographyClient(key.id, credential);
    // If the input is Base64, decode it; otherwise, create a buffer from utf8
    const addressBuffer = isBase64
      ? Buffer.from(address, "base64")
      : Buffer.from(address, "utf8");
    return [addressBuffer, cryptoClient];
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const getEncryptedPrivateKey = async (privateKeyToEncrypt) => {
  try {
    const [addressBuffer, cryptoClient] = await generateAddressBuffer(privateKeyToEncrypt);
    const encryptionResult = await cryptoClient.encrypt(
      "RSA-OAEP",
      addressBuffer
    );
    // Convert the encrypted buffer to Base64 for safe transmission/storage
    return encryptionResult.result.toString("base64");
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const getDecryptedPrivateKey = async (privateKeyToDecrypt) => {
  try {
    const [encryptedAddressBuffer, cryptoClient] = await generateAddressBuffer(
      privateKeyToDecrypt,
      true
    );
    const decryptionResult = await cryptoClient.decrypt(
      "RSA-OAEP",
      encryptedAddressBuffer
    );
    // Convert the decrypted buffer to utf8 (original plaintext format)
    return decryptionResult.result.toString("utf8");
  } catch (err) {
    console.error(err);
    throw err;
  }
};