import { privateKeyToAccount, smartWallet } from "thirdweb/wallets";
import Environment from "../../config";
import { currentChain, thirdWebClient } from "../../utils/thirdwebHelpers";
import { CustomError } from "../../errors";

export const getTreasurySmartAccount = async () => {
  const { SWAPUP_TREASURY_API_KEY, SWAPUP_TREASURY_SMART_ACCOUNT } = Environment;

  if (!SWAPUP_TREASURY_SMART_ACCOUNT || !SWAPUP_TREASURY_API_KEY) {
    throw new CustomError(404, "SwapUp treasury smart account credentials not found.");
  }

  // Create a wallet from the private key
  const personalAccount = privateKeyToAccount({
    client: thirdWebClient,
    privateKey: SWAPUP_TREASURY_API_KEY,
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