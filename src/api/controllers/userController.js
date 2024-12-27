import Environment from "../../config";
import db from "../../database/models";
import { handleError } from "../../errors";
import logger from "../../logger";
import { createOrGetSmartAccount, tryParseJSON } from "../utils/helpers";


import { smartWallet, privateKeyToAccount } from "thirdweb/wallets";
import { currentChain, thirdWebClient } from "../../utils/thirdwebHelpers";
import { getNFTCollectionsByWalletId } from "../utils/nft";
import { Op, Sequelize } from "sequelize";
import { getSubnameListedOnL2Api } from "../../service/thirdparty.service";
import { getFormattedUserDetails, updateUserPointsByWallet } from "../utils/user";


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
      },
      attributes: { exclude: ['twitter_access', 'privateKey'] }
    });

    // Format the user object before sending the response, excluding twitter_access
    let userData = user.dataValues;
    let formattedUser = getFormattedUserDetails(userData);

    if (created || (!userData.smartAccount && !privateKey)) {
      const { smartAccount, newSmartWallet } = await createOrGetSmartAccount(walletId);
      formattedUser = { ...formattedUser, smartAccount: smartAccount.address };
      await newSmartWallet.disconnect();
    }

    if (created) {
      logger.info("Created user: ", formattedUser);
      logger.info("Created new smart account smartAccount: ", formattedUser.smartAccount);

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

async function create_user_platform_wallet(req, res) {
  try {
    const walletId = req.params.walletId;

    const { smartAccount, newSmartWallet } = await createOrGetSmartAccount(walletId);
    const smartAccountAddress = smartAccount.address;
    await newSmartWallet.disconnect();

    return res.status(201).json({
      success: true,
      message: `New smart account created for user with wallet ID ${walletId}.`,
      data: { smartAccount: smartAccountAddress }
    });

  } catch (err) {
    handleError(res, err, "create_user_platform_wallet: error");
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
      where: { wallet: walletId },
      attributes: { exclude: ['twitter_access', 'privateKey'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with wallet ID ${walletId} not found.`
      });
    }

    // Format the user object before sending the response, excluding twitter_access
    const userData = user.dataValues;
    const formattedUser = getFormattedUserDetails(userData);

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
    const user = await db.users.findOne({
      where: { wallet: walletId },
      attributes: { exclude: ['twitter_access', 'privateKey'] }
    });

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
    const userData = user.dataValues;
    const formattedUser = getFormattedUserDetails(userData);

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

export const userController = {
  create_user,
  get_user_twitter_access_by_wallet,
  update_user_points,
  get_user_by_wallet,
  edit_user_profile,
  test_aa_address_using_key,
  create_user_platform_wallet
};