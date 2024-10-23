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
    const { twitter_access, ...restUserData } = user.dataValues;
    let formattedUser = getFormattedUserDetails(restUserData);

    if (created) {
      logger.info("Created user: ", formattedUser);
      const generatedPrivateKey = Wallet.createRandom().privateKey;
      logger.info(`Generated Private Key: ${generatedPrivateKey}`);

      const personalAccount = privateKeyToAccount({
        client: thirdWebClient,
        privateKey: generatedPrivateKey
      });

      logger.info("Personal account:", personalAccount);
      // Configure the smart wallet
      const newSmartWallet = smartWallet({
        chain: currentChain,
        sponsorGas: true,
      });

      logger.info("newSmartWallet: ", newSmartWallet);

      // Connect the smart wallet
      const smartAccount = await newSmartWallet.connect({
        client: thirdWebClient,
        personalAccount,
      });

      logger.info("smartAccount: ", smartAccount);

      // Define admin addresses to be added
      const adminAddresses = [walletId, Environment.SWAPUP_TREASURY_WALLET]; // User's walletId and Swapup treasury wallet

      try {
        // Function to add an admin to the smart wallet
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
        if (walletId === Environment.SWAPUP_TREASURY_WALLET) {
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

      let updatedUser = null;

      // Update the user record with the generated private key and smart account address
      if (generatedPrivateKey && smartAccount.address) {
        updatedUser = await user.update({
          privateKey: generatedPrivateKey,
          smartAccount: smartAccount.address,
        });
      }

      // Reformat the updated user data
      if (updatedUser !== null) {
        const { twitter_access, ...updatedUserData } = updatedUser.dataValues;
        formattedUser = getFormattedUserDetails(updatedUserData);
      }

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

async function transfer_tokens(req, res) {
  try {
    const adminWallet = Environment.SWAPUP_TREASURY_WALLET;
    const { amountToTransfer, tokenAddress, smartAccountPrivateKey } = req.body;

    // Create a wallet from the private key
    const personalAccount = privateKeyToAccount({
      client: thirdWebClient,
      privateKey: smartAccountPrivateKey,
    });

    // Reconnect to the smart wallet (for the smart account)
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
      to: adminWallet,
      amount: amountToTransfer,
    });

    // Send the transfer transaction from the smart account
    const transferResult = await sendTransaction({
      transaction,
      account: smartAccount,
    });

    // Log the transaction and respond with success
    logger.info(`Tokens transferred to ${adminWallet}`, transferResult);
    return res.status(201).json({
      success: true,
      message: `Successfully transferred ${amountToTransfer} tokens to ${adminWallet}`,
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
    const { twitter_access, ...restUserData } = user.dataValues;
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
function test(req, res) {
  res.send({ network: Environment.NETWORK_ID, message: "SwapUp user test route" });
}

// Helper functions

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
  transfer_tokens
};