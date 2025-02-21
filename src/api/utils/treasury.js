import { privateKeyToAccount, smartWallet } from "thirdweb/wallets";
import Environment from "../../config";
import { currentChain, thirdWebClient } from "../../utils/thirdwebHelpers";
import { CustomError } from "../../errors";
import { getTreasurySmartAccountPrivateKeyFromAzureVault } from "./azureVault";

export const getTreasurySmartAccount = async () => {
  const { SWAPUP_TREASURY_PRIVATE_KEY } = Environment;

  let swapupTreasuryPrivateKey = SWAPUP_TREASURY_PRIVATE_KEY;

  if (Environment.ENVIRONMENT_KEY === 'production') {
    swapupTreasuryPrivateKey = await getTreasurySmartAccountPrivateKeyFromAzureVault();
  }

  if (!swapupTreasuryPrivateKey) {
    throw new CustomError(404, "SwapUp smart treasury account private key not found.");
  }

  // Create a wallet from the private key
  const personalAccount = privateKeyToAccount({
    client: thirdWebClient,
    privateKey: swapupTreasuryPrivateKey,
  });

  // Reconnect to the smart wallet (for the treasury smart account)
  const createdSmartWallet = smartWallet({
    chain: currentChain,
    sponsorGas: true,
  });

  // Connect to the smart account
  const smartAccount = await createdSmartWallet.connect({
    client: thirdWebClient,
    personalAccount,
  });

  return { smartAccount, createdSmartWallet };
};