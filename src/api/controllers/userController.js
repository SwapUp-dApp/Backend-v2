import Environment from "../../config";
import db from "../../database/models";
import { handleError } from "../../errors";
import logger from "../../logger";
import { tryParseJSON } from "../utils/helpers";


import { Wallet } from "ethers";
import { smartWallet, privateKeyToAccount } from "thirdweb/wallets";
import { addAdmin } from "thirdweb/extensions/erc4337";
import { sendTransaction, getContract } from "thirdweb";
import { currentChain, thirdWebClient } from "../../utils/thirdwebHelpers";
import { transfer } from "thirdweb/extensions/erc20";

async function list_all_users(req, res) {
  try {
    let usersData = await db.users.findAll(req.body);

    if (usersData) {
      res.json({
        success: true,
        message: "list_all_users",
        data: usersData
      });
    }
  } catch (err) {
    handleError(res, err, "***list_all_users: error");
  }
}

async function create_user(req, res) {
  try {
    const walletId = req.params.walletId;
    const { points, tags, description, title } = req.body;

    const [user, created] = await db.users.findOrCreate({
      where: { wallet: walletId },
      defaults: {
        wallet: walletId,
        title: title,
        description: description,
        images: JSON.stringify({ avatar: '', coverImage: '' }),
        points: JSON.stringify(points),
        social_links: JSON.stringify({ twitter: '', warpcast: '' }),
        tags: JSON.stringify(tags)
      }
    });

    // Format the user object before sending the response, excluding twitter_access
    let { twitter_access, privateKey, ...restUserData } = user.dataValues;
    let formattedUser = getFormattedUserDetails(restUserData);

    if (created) {
      logger.info("Created user: ", formattedUser);

      const smartAccount = await createOrGetSmartAccount(walletId);
      logger.info("smartAccount: ", smartAccount);

      const latestUser = await db.users.findOne({
        where: { wallet: walletId }
      });

      const { twitter_access, privateKey, ...restUserLatestData } = await latestUser.dataValues;
      formattedUser = getFormattedUserDetails(restUserLatestData);

      return res.status(201).json({
        success: true,
        message: `User with wallet ID ${walletId} created successfully.`,
        data: formattedUser
      });

    } else {
      return res.status(200).json({
        success: true,
        message: `User with wallet ID ${walletId} already exists.`,
        data: formattedUser
      });
    }
  } catch (err) {
    handleError(res, err, "create_user: error");
  }
}

// To transfer ERC20 Tokens from users smart account --> swapup treasury smart account
async function transfer_erc20_tokens(req, res) {
  try {
    const userWalletId = req.params.userWalletId;
    const { amountToTransfer, tokenAddress } = req.body;

    const { SWAPUP_TREASURY_SMART_ACCOUNT } = Environment;

    const smartAccount = await createOrGetSmartAccount(userWalletId);

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
      to: SWAPUP_TREASURY_SMART_ACCOUNT,
      amount: amountToTransfer,
    });

    // Send the transfer transaction from the smart account
    const transferResult = await sendTransaction({
      transaction,
      account: smartAccount,
    });

    // Log the transaction and respond with success
    logger.info(`Tokens transferred to ${SWAPUP_TREASURY_SMART_ACCOUNT}`, transferResult);

    return res.status(201).json({
      success: true,
      message: `Successfully transferred ${amountToTransfer} tokens to ${SWAPUP_TREASURY_SMART_ACCOUNT}`,
      transaction: transferResult,
    });
  } catch (err) {
    handleError(res, err, "transfer_tokens: error");
  }
}

async function get_user_twitter_access_by_wallet(req, res) {
  const walletId = req.params.walletId;

  try {
    const user = await db.users.findOne({
      where: { wallet: walletId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const formattedResponse = () => {
      const swapJSON = user.toJSON();

      let formattedSwap = {
        twitter_access: tryParseJSON(swapJSON.twitter_access),
      };

      return formattedSwap;
    };

    return res.status(200).json({
      success: true,
      message: `get_user_twitter_access_by_wallet: success`,
      data: formattedResponse()
    });

  } catch (err) {
    handleError(res, err, "get_user_twitter_access_by_wallet: error");
  }
}

async function update_user_points(req, res) {

  try {
    const { walletId } = req.params;
    const { pointsToAdd, keyType, counterPartyWalletId, defaultPointSystem } = req.body;

    // Ensure pointsToAdd is a valid number
    if (typeof pointsToAdd !== 'number' || isNaN(pointsToAdd) || !keyType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid points or key type provided.'
      });
    }
    // Update points for the main user
    const updatedPoints = await updateUserPointsByWallet(walletId, pointsToAdd, keyType, defaultPointSystem);

    // Update points for the counterpart user, if provided
    let updatedCounterPartPoints = null;

    if (counterPartyWalletId) {
      updatedCounterPartPoints = await updateUserPointsByWallet(counterPartyWalletId, pointsToAdd, keyType, defaultPointSystem);
    }

    return res.status(200).json({
      success: true,
      message: `Points updated successfully.`,
      data: {
        points: updatedPoints,
        counterPartPoints: updatedCounterPartPoints,
      }
    });

  } catch (err) {
    handleError(res, err, "update_user_points: error");
  }
}

async function get_user_by_wallet(req, res) {
  try {
    const walletId = req.params.walletId;

    // Find the user based on the wallet ID
    const user = await db.users.findOne({
      where: { wallet: walletId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with wallet ID ${walletId} not found.`
      });
    }

    // Format the user object before sending the response, excluding twitter_access
    const { twitter_access, privateKey, ...restUserData } = user.dataValues;
    const formattedUser = getFormattedUserDetails(restUserData);

    // Send the formatted user data
    return res.status(200).json({
      success: true,
      data: formattedUser
    });

  } catch (err) {
    handleError(res, err, "get_user_by_wallet: error");
  }
}

async function edit_user_profile(req, res) {
  try {
    const { walletId } = req.params;
    const { title, description, social_links } = req.body;

    // Find the user by wallet ID
    const user = await db.users.findOne({ where: { wallet: walletId } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with wallet ID ${walletId} not found.`
      });
    }

    // Update profile details if provided
    if (title !== undefined) user.title = title;
    if (description !== undefined) user.description = description;

    if (social_links) {
      const currentSocialLinks = tryParseJSON(user.social_links);
      user.social_links = JSON.stringify({
        ...currentSocialLinks,
        ...social_links // Merge existing social links with new ones
      });
    }

    // Save updated user details
    await user.save();

    // Format the user object for response, excluding twitter_access
    const { twitter_access, ...restUserData } = user.dataValues;
    const formattedUser = getFormattedUserDetails(restUserData);

    return res.status(200).json({
      success: true,
      message: `User profile with wallet ID ${walletId} updated successfully.`,
      data: formattedUser
    });
  } catch (err) {
    handleError(res, err, "edit_user_profile: error");
  }
}

async function test_aa_address_using_key(req, res) {
  try {
    const { privateKey } = req.body;

    let personalAccount, newSmartWallet, smartAccount;
    personalAccount = privateKeyToAccount({
      client: thirdWebClient,
      privateKey: privateKey
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

    logger.info("smart account address: ", smartAccount.address);

    // Send the formatted user data
    return res.status(200).json({
      success: true,
      data: { smartAccount: smartAccount.address, personalAccount: personalAccount.address }
    });

  } catch (err) {
    handleError(res, err, "test_aa_address_using_key: error");
  }
}

// Helper functions - start here

// For creating new or getting smart wallet details from db
async function createOrGetSmartAccount(walletId) {
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

    return smartAccount; // Return the connected smart account
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

  return smartAccount; // Return the newly connected smart account
}

async function updateUserPointsByWallet(walletId, pointsToAdd, keyType, defaultPointSystem) {
  // Fetch the user by walletId
  const user = await db.users.findOne({ where: { wallet: walletId } });

  if (!user) {
    throw new Error(`User with wallet ID ${walletId} not found.`);
  }

  // Parse the user's points object from the database
  let userPoints = tryParseJSON(user.points);

  // Ensure the points structure exists, initialize if not
  if (!userPoints || typeof userPoints !== 'object') {
    userPoints = defaultPointSystem; // Initialize with 0 if the structure is missing
  }

  // Update the points for the specific keyType
  userPoints[keyType] = (userPoints[keyType] || 0) + pointsToAdd;

  // Update the total points
  userPoints.total = Object.keys(userPoints)
    .filter(key => key !== 'total') // Exclude 'total' key from summing
    .reduce((sum, key) => sum + userPoints[key], 0);

  // Save the updated points back to the user record
  user.points = JSON.stringify(userPoints);
  await user.save();

  return userPoints;
}

const getFormattedUserDetails = (restUserData) => {
  return ({
    ...restUserData,
    images: tryParseJSON(restUserData.images),
    social_links: tryParseJSON(restUserData.social_links),
    tags: tryParseJSON(restUserData.tags),
    points: tryParseJSON(restUserData.points)
  });
};

export const userController = {
  list_all_users,
  create_user,
  get_user_twitter_access_by_wallet,
  update_user_points,
  get_user_by_wallet,
  edit_user_profile,
  transfer_erc20_tokens,
  test_aa_address_using_key
};