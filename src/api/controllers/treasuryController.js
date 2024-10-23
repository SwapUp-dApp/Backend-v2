import Environment from "../../config";
import { CustomError, handleError } from "../../errors";
import logger from "../../logger";


import { smartWallet, privateKeyToAccount } from "thirdweb/wallets";
import { sendTransaction, getContract } from "thirdweb";
import { currentChain, thirdWebClient } from "../../utils/thirdwebHelpers";
import { transfer } from "thirdweb/extensions/erc20";

async function transfer_erc20_tokens(req, res) {
  try {
    const { amountToTransfer, tokenAddress, transferToAddress } = req.body;

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

    // Retrieve the ERC-20 token contract
    const tokenContract = getContract({
      address: tokenAddress,
      client: thirdWebClient,
      chain: currentChain,
    });

    // Check if the token contract was initialized correctly
    if (!tokenContract) {
      throw new Error("Token contract could not be initialized.");
    }

    // Call the extension function to prepare the transaction
    const transaction = transfer({
      contract: tokenContract,
      to: transferToAddress,
      amount: amountToTransfer,
    });

    // Send the transfer transaction from the smart account
    const transferResult = await sendTransaction({
      transaction,
      account: smartAccount,
    });

    // Log the transaction and respond with success
    logger.info(`Tokens transferred to ${amountToTransfer}`, transferResult);
    return res.status(201).json({
      success: true,
      message: `Successfully transferred ${amountToTransfer} tokens to ${amountToTransfer}`,
      transaction: transferResult,
    });
  } catch (err) {
    handleError(res, err, "transfer_tokens: error");
  }
}

export const treasuryController = {
  transfer_erc20_tokens
};