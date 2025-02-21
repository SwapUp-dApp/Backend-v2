import { CustomError, handleError } from "../../errors";
import logger from "../../logger";


import { sendTransaction, getContract } from "thirdweb";
import { currentChain, thirdWebClient } from "../../utils/thirdwebHelpers";
import { transfer } from "thirdweb/extensions/erc20";
import { getTreasurySmartAccount } from "../utils/treasury";
import { getAlchemy } from "../../utils/alchemy";
import Environment from "../../config";
import { Utils } from "alchemy-sdk";
import db from "../../database/models";
import { getEthereumCurrencyToken, getSubscriptionTokenBalance } from "../utils/helpers";
import { availableNetworks, getAvailableTokensList } from "../../constants/params";


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
    handleError(res, err, "transfer_erc20_tokens: error");
  }
}

async function smart_treasury_wallet_balance_check(req, res) {
  try {
    const { address } = req.query;

    const treasuryWallet = Environment.SWAPUP_TREASURY_SMART_ACCOUNT;

    if (!treasuryWallet) {
      throw new CustomError(404, "SWAPUP_TREASURY_SMART_ACCOUNT not found in environment");
    }

    const alchemyInstance = getAlchemy();
    const availableTokens = getAvailableTokensList(currentChain.id || Environment.NETWORK_ID);
    let balanceRes, response, subscriptionToken;

    if (address) {

      try {
        subscriptionToken = await db.subscriptionTokens.findOne({
          where: { address }
        });
      } catch (error) {
        logger.error("Error fetching subscription token:", error);
      }

      if (subscriptionToken) {
        response = await getSubscriptionTokenBalance(treasuryWallet, subscriptionToken.address);
      } else {
        const balancesRes = await alchemyInstance.core.getTokenBalances(treasuryWallet, [address]);
        const matchedErc20Token = availableTokens.find(token => token.address === address);
        balanceRes = balancesRes.tokenBalances[0].tokenBalance;
        response = {
          ...matchedErc20Token,
          balance: Number(Utils.formatEther(balanceRes))
        };
      }

    } else {
      let foundNetwork = availableNetworks.find(network => network.id === currentChain.id);
      const ethTokenObject = availableTokens.find(token => token.id === foundNetwork.key);
      let ethCurrencyToken;

      try {
        ethCurrencyToken = await getEthereumCurrencyToken();
      } catch (error) {
        logger.error("Error fetching currency token:", error);
      }

      balanceRes = await alchemyInstance.core.getBalance(treasuryWallet, 'latest');
      response = {
        ...ethTokenObject,
        balance: Number(Utils.formatEther(balanceRes)),
        usdBalance: ethCurrencyToken ? Number(Utils.formatEther(balanceRes)) * ethCurrencyToken.price : ''
      };
    }

    logger.info(`Smart Treasury Wallet Balance Check: `, response.balance);
    return res.status(200).json({
      success: true,
      message: `Successfully received balance of ${response.balance} ${response.symbol || ''}`,
      data: { ...response },
    });
  } catch (err) {
    handleError(res, err, "smart_treasury_wallet_balance_check: error");
  }
}

async function test_treasury_smart_account(req, res) {
  try {
    const { smartAccount, createdSmartWallet } = await getTreasurySmartAccount();

    return res.status(201).json({
      success: true,
      message: `Successfully able to connect treasury smart account.`,
      data: { smartAccount: smartAccount.address }
    });

  } catch (err) {
    handleError(res, err, "test_treasury_smart_account: error");
  }
}

export const treasuryController = {
  transfer_erc20_tokens,
  smart_treasury_wallet_balance_check,
  test_treasury_smart_account
};