import dotenv from "dotenv";
import crypto from "crypto";
import logger from "../../logger";
import db from "../../database/models";
import Environment from "../../config";
import { getContract, sendTransaction } from "thirdweb";
import { addAdmin } from "thirdweb/extensions/erc4337";
import { privateKeyToAccount, smartWallet } from "thirdweb/wallets";
import { Wallet } from "ethers";
import { currentChain, thirdWebClient } from "../../utils/thirdwebHelpers";
import { SwapMode } from "./constants";
import { getDecryptedPrivateKey, getEncryptedPrivateKey } from "./encryption";
import { getAlchemy } from "../../utils/alchemy";
import { Utils } from "alchemy-sdk";

dotenv.config();

// const fs = require('fs');
// const path = require('path');
// const util = require('util');

// const readFile = util.promisify(fs.readFile);
// const unlink = util.promisify(fs.unlink);

// export const getBuffer = (image) => {
//   const filePath = path.join(__dirname, '../../../pictures/', image);
//   return readFile(filePath);
// };

// export const deleteFile = (image) => {
//   const filePath = path.join(__dirname, '../../../pictures/', image);
//   return unlink(filePath);
// };

export function tryParseJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (err) {
    return jsonString; // Return original string if parsing fails
  }
}

// Webhook helper functions starts here

export const isExpiredWebhook = (timestamp, expirationInSeconds) => {
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime - parseInt(timestamp) > expirationInSeconds;
};

export function isValidWebhookSignature(body, timestamp, signature, secret) {
  const dataToSign = `${timestamp}.${JSON.stringify(body)}`;
  logger.info("dataToSign: ", dataToSign);

  // Generate the HMAC SHA-256 signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(dataToSign)
    .digest("hex");

  logger.info("expectedSignature: ", expectedSignature);

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}
// Webhook helper functions ends here

// Helper for adding a new record in notifications table
// Hint: Considering the default notification type is private swap
// Note: originator_address --> User who perform some action on swap
// Note: receiver_address --> User who receives notification

/**
 * @typedef {Object} CreateNotificationInput
 * @property {string} originator_address - User who performs some action on swap
 * @property {string} receiver_address - User who receives the notification
 * @property {string} trade_id - The trade ID
 * @property {string} [open_trade_id] - Optional, defaults to null
 * @property {number} swap_mode - Defaults to PRIVATE
 * @property {number} status - The notification status
 */

/**
 * Creates a new notification record in the database.
 * @param {CreateNotificationInput} input - The input object
 */
export const createNotification = async ({
  originator_address,
  receiver_address,
  trade_id,
  open_trade_id = null,
  swap_mode = SwapMode.PRIVATE,
  status
}) => {
  const notificationRes = await db.notifications.create({
    originator_address,
    receiver_address,
    trade_id,
    open_trade_id,
    read: false,
    status,
    swap_mode
  });

  logger.info("New notification created: " + notificationRes.id);
};

// Helper function for creating new smart wallet against a wallet id
export const createOrGetSmartAccount = async (walletId) => {
  // Find the user based on the wallet ID
  const user = await db.users.findOne({
    where: { wallet: walletId }
  });

  if (!user) {
    throw new Error(`User with wallet ID ${walletId} not found.`);
  }

  let personalAccount, newSmartWallet, smartAccount;

  // Check if the smart account already exists in the user's data
  if (user.smartAccount && user.privateKey) {

    let decryptedPrivateKey;

    if (Environment.ENVIRONMENT_KEY === "local") {
      // using the saved private key for local environment
      decryptedPrivateKey = user.privateKey;
    } else {
      // Decrypting the saved private key 
      decryptedPrivateKey = await getDecryptedPrivateKey(user.privateKey);
    }

    personalAccount = privateKeyToAccount({
      client: thirdWebClient,
      privateKey: decryptedPrivateKey
    });

    // Create a new smart wallet
    newSmartWallet = smartWallet({
      chain: currentChain,
      sponsorGas: true
    });

    // Connect to the existing smart account
    smartAccount = await newSmartWallet.connect({
      client: thirdWebClient,
      personalAccount
    });

    return { smartAccount, newSmartWallet, decryptedPrivateKey }; // Return the connected smart account
  }

  // If no smart account exists, create a new one
  const generatedPrivateKey = Wallet.createRandom().privateKey;
  personalAccount = privateKeyToAccount({
    client: thirdWebClient,
    privateKey: generatedPrivateKey
  });

  // Configure the new smart wallet
  newSmartWallet = smartWallet({
    chain: currentChain,
    sponsorGas: true
  });

  // Connect to the new smart account
  smartAccount = await newSmartWallet.connect({
    client: thirdWebClient,
    personalAccount
  });

  logger.info(`New smart account created: ${smartAccount.address} owned by wallet: ${walletId}`);

  // Save the new smart account and private key to the user's record
  if (smartAccount.address && generatedPrivateKey) {

    let encryptedPrivateKey;

    if (Environment.ENVIRONMENT_KEY === "local") {
      // saving generated private key in db
      encryptedPrivateKey = generatedPrivateKey;
    } else {
      // Encrypt the newly created private key and save in db
      encryptedPrivateKey = await getEncryptedPrivateKey(generatedPrivateKey);
    }

    await user.update({
      privateKey: encryptedPrivateKey,
      smartAccount: smartAccount.address
    });
  }

  // Define admin addresses to be added
  const adminAddresses = [walletId, Environment.SWAPUP_TREASURY_SMART_ACCOUNT]; // User's walletId and Swapup treasury wallet

  // Adding admins to the smart wallet
  try {
    const addAdminToSmartWallet = async (adminAddress) => {
      const adminTransaction = addAdmin({
        contract: getContract({
          address: smartAccount.address,
          client: thirdWebClient,
          chain: currentChain
        }),
        account: smartAccount,
        adminAddress
      });

      // logger.info(`Adding admin: ${adminAddress}`, adminTransaction);

      return await sendTransaction({
        transaction: adminTransaction,
        account: smartAccount
      });
    };

    // Add admin accounts
    if (walletId === Environment.SWAPUP_TREASURY_SMART_ACCOUNT) {
      const result = await addAdminToSmartWallet(walletId);
      logger.info(`Admin ${walletId} added: `, result);
    } else {
      for (const adminAddress of adminAddresses) {
        const result = await addAdminToSmartWallet(adminAddress);
        logger.info(`Admin ${adminAddress} added: `, result);
      }
    }
  } catch (error) {
    logger.error(`Admin not added: ${error.message || error}`);
  }

  return { smartAccount, newSmartWallet, decryptedPrivateKey }; // Return the newly connected smart account
};

export const getSubscriptionTokenBalance = async (walletAddress) => {
  const subscriptionToken = await db.subscriptionTokens.findOne({
    where: { chainId: Environment.NETWORK_ID },
  });

  if (!subscriptionToken) {
    throw new Error("Subscription token not found");
  }

  let alchemyInstance = getAlchemy();
  const subscriptionTokenBalances = await alchemyInstance.core.getTokenBalances(walletAddress, [subscriptionToken.address]);

  let computedResult = {
    address: subscriptionToken.address,
    chainId: subscriptionToken.chainId || Environment.NETWORK_ID,
    name: subscriptionToken.name,
    symbol: subscriptionToken.symbol,
    balance: 0,
    usdBalance: 0,
    iconUrl: subscriptionToken.iconUrl,
    tradeCharges: subscriptionToken.tradeCharges,
  };

  if (subscriptionTokenBalances && subscriptionTokenBalances.tokenBalances.length > 0) {
    const balance = Number(Utils.formatEther(subscriptionTokenBalances.tokenBalances[0].tokenBalance));
    computedResult = {
      ...computedResult,
      balance,
      usdBalance: balance * Number(subscriptionToken.usdAmount),
    };
  }

  return computedResult;
};