const crypto = require('crypto');
import logger from '../../logger';
import db from "../../database/models";
import Environment from '../../config';
import { getContract, sendTransaction } from 'thirdweb';
import { addAdmin } from 'thirdweb/extensions/erc4337';
import { privateKeyToAccount, smartWallet } from 'thirdweb/wallets';
import { Wallet } from 'ethers';
import { currentChain, thirdWebClient } from '../../utils/thirdwebHelpers';

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

export const isExpiredWebhook = (timestamp, expirationInSeconds,) => {
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime - parseInt(timestamp) > expirationInSeconds;
};

export function isValidWebhookSignature(body, timestamp, signature, secret) {
  const dataToSign = `${timestamp}.${JSON.stringify(body)}`;
  logger.info("dataToSign: ", dataToSign);

  // Generate the HMAC SHA-256 signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex');

  logger.info('expectedSignature: ', expectedSignature);

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature),
  );
}
// Webhook helper functions ends here

// helper for entering a new record in notififications table
export const createNotification = async (
  receiver_address,
  originator_address,
  status,
  trade_id,
  proposal_id = null
) => {
  await db.notifications.create({
    receiver_address,
    originator_address,
    status,
    trade_id,
    read: false,
    proposal_id
  });
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
    // Create personal account with the existing private key
    personalAccount = privateKeyToAccount({
      client: thirdWebClient,
      privateKey: user.privateKey,
    });

    // Create a new smart wallet
    newSmartWallet = smartWallet({
      chain: currentChain,
      sponsorGas: true,
    });

    // Connect to the existing smart account
    smartAccount = await newSmartWallet.connect({
      client: thirdWebClient,
      personalAccount,
    });

    return { smartAccount, newSmartWallet }; // Return the connected smart account
  }

  // If no smart account exists, create a new one
  const generatedPrivateKey = Wallet.createRandom().privateKey;
  personalAccount = privateKeyToAccount({
    client: thirdWebClient,
    privateKey: generatedPrivateKey,
  });

  // Configure the new smart wallet
  newSmartWallet = smartWallet({
    chain: currentChain,
    sponsorGas: true,
  });

  // Connect to the new smart account
  smartAccount = await newSmartWallet.connect({
    client: thirdWebClient,
    personalAccount,
  });

  // Save the new smart account and private key to the user's record
  if (smartAccount.address && generatedPrivateKey) {
    await user.update({
      privateKey: generatedPrivateKey,
      smartAccount: smartAccount.address,
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
          chain: currentChain,
        }),
        account: smartAccount,
        adminAddress,
      });

      // logger.info(`Adding admin: ${adminAddress}`, adminTransaction);

      return await sendTransaction({
        transaction: adminTransaction,
        account: smartAccount,
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

  return { smartAccount, newSmartWallet }; // Return the newly connected smart account
};
