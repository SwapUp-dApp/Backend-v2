import { DefaultAzureCredential, getDefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import Environment from '../../config';

export const getTreasurySmartAccountPrivateKeyFromAzureVault = async () => {

  const keyVaultUrl = `https://${Environment.TREASURY_AZURE_VAULT_NAME}.vault.azure.net`;

  // Authenticate using Managed Identity
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(keyVaultUrl, credential);

  // Replace with your secret name
  const secretName = Environment.TREASURY_AZURE_VAULT_SECRET_NAME;

  // Retrieve the secret value
  const secret = await client.getSecret(secretName);

  return secret.value;
}

