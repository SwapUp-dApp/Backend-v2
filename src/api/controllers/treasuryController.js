import { handleError } from "../../errors";
import logger from "../../logger";


import { sendTransaction, getContract } from "thirdweb";
import { currentChain, thirdWebClient } from "../../utils/thirdwebHelpers";
import { transfer } from "thirdweb/extensions/erc20";
import { getTreasurySmartAccount } from "../utils/treasury";


// To transfer ERC20 Tokens from swapup treasury smart account --> users smart account
async function transfer_erc20_tokens(req, res) {
  try {
    const { amountToTransfer, tokenAddress, transferToAddress } = req.body;

    const { smartAccount, createdSmartWallet } = await getTreasurySmartAccount();

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

    // Disconnect the smart account
    await createdSmartWallet.disconnect();

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