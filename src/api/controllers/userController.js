import Environment from "../../config";
import db from "../../database/models";
import { handleError } from "../../errors";
import logger from "../../logger";
import { createOrGetSmartAccount, tryParseJSON } from "../utils/helpers";


import { smartWallet, privateKeyToAccount } from "thirdweb/wallets";
import { sendTransaction, getContract } from "thirdweb";
import { currentChain, thirdWebClient } from "../../utils/thirdwebHelpers";
import { transfer } from "thirdweb/extensions/erc20";
import { getNFTCollectionsByWalletId } from "../utils/nft";
import { Op, Sequelize } from "sequelize";
import { getSubnameListedOnL2Api } from "../../service/thirdparty.service";


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

async function list_new_members(req, res) {
  try {
    // Fetch the latest 5 users ordered by createdAt in descending order
    const latestUsers = await db.users.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: { exclude: ['twitter_access', 'privateKey', 'points', 'tags', 'social_links', 'updatedAt', 'description'] }
    });

    if (!latestUsers || latestUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found.",
      });
    }

    // Fetch NFTs and collections for each user
    const usersWithNFTs = await Promise.all(
      latestUsers.map(async (user) => {
        const formattedUser = getFormattedUserDetails(user.dataValues);
        const avatar = formattedUser.images?.avatar || '';
        delete formattedUser.images;

        try {
          // Fetch NFTs and collections for the user's wallet
          const { nftCollections } = await getNFTCollectionsByWalletId(formattedUser.wallet);

          // Prepare the list of three NFTs based on the collections
          let nftProfiles = [];
          const collectionKeys = Object.keys(nftCollections);

          if (collectionKeys.length === 1) {
            // Only one collection: Include all NFTs (up to 3)
            nftProfiles = nftCollections[collectionKeys[0]].slice(0, 3);
          } else if (collectionKeys.length === 2) {
            // Two collections: Include two from one collection and one from the other
            const firstCollectionNFTs = nftCollections[collectionKeys[0]].slice(0, 2);
            const secondCollectionNFTs = nftCollections[collectionKeys[1]].slice(0, 1);
            nftProfiles = [...firstCollectionNFTs, ...secondCollectionNFTs];
          } else {
            // Three or more collections: Include the first NFT from each collection
            nftProfiles = collectionKeys.slice(0, 3).map((key) => nftCollections[key][0]);
          }

          // Fetch all matching subscription records and extract the first createdAt
          const subscriptionRecords = await db.payments.findAll({
            where: {
              paidBy: formattedUser.wallet,
              subscriptionPurchase: { [Op.ne]: null }
            },
            order: [["createdAt", "ASC"]],
            attributes: ["createdAt"]
          });

          const membershipCreatedAt = subscriptionRecords.length > 0 ? subscriptionRecords[0].createdAt : '';

          return { ...formattedUser, avatar, nftProfiles, totalCollections: collectionKeys.length, membershipCreatedAt };
        } catch (err) {
          // If NFT fetching fails, return the user without NFT details
          logger.error(`Error fetching NFTs for wallet ${formattedUser.wallet}:`, err.message);
          return { ...formattedUser, avatar, nftProfiles: [], totalCollections: 0, membershipCreatedAt };
        }
      })
    );

    return res.status(200).json({
      success: true,
      message: "Successfully got new members data.",
      data: usersWithNFTs
    });

  } catch (err) {
    handleError(res, err, "list_new_members: error");
  }
}

async function list_top_traders(req, res) {
  try {

    // Step 1: Query the swaps table to count completed swaps by init_address and accept_address
    const initCounts = await db.swaps.findAll({
      where: { status: 4 },
      attributes: [
        "init_address",
        [Sequelize.fn("COUNT", Sequelize.col("init_address")), "swapCount"]
      ],
      group: ["init_address"]
    });

    const acceptCounts = await db.swaps.findAll({
      where: { status: 4 },
      attributes: [
        "accept_address",
        [Sequelize.fn("COUNT", Sequelize.col("accept_address")), "swapCount"]
      ],
      group: ["accept_address"]
    });

    // Step 2: Combine and aggregate counts
    const addressCounts = {};

    [...initCounts, ...acceptCounts].forEach((entry) => {
      const address = entry.init_address || entry.accept_address;
      const count = parseInt(entry.dataValues.swapCount, 10);

      if (addressCounts[address]) {
        addressCounts[address] += count;
      } else {
        addressCounts[address] = count;
      }
    });

    // Step 3: Sort addresses by swap count and get the top 10
    const topAddresses = Object.entries(addressCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([address, swapCount]) => ({ address, swapCount }));

    // Step 4: Fetch user details from the users table
    const userDetails = await db.users.findAll({
      where: {
        wallet: { [Op.in]: topAddresses.map((entry) => entry.address) }
      },
      attributes: ["wallet", "images", "title", "createdAt"]
    });

    let subnamesData;

    try {
      const subnameRes = await getSubnameListedOnL2Api();
      subnamesData = subnameRes.data.items;
    } catch (error) {
      logger.error("Error fetching subnames:", error);
      subnamesData = [];
    }

    // Step 6: Merge swap counts with user details
    const responseData = await Promise.all(
      topAddresses.map(async (entry) => {
        const user = userDetails.find((u) => u.wallet === entry.address).dataValues;
        const formattedUser = getFormattedUserDetails(user);

        const foundSubnames = subnamesData.filter(item => item.owner.toLowerCase() === formattedUser.wallet.toLowerCase());

        try {
          const { nftCollections } = await getNFTCollectionsByWalletId(formattedUser.wallet);
          return {
            ...formattedUser,
            wallet: user.wallet || entry.address,
            totalSwaps: entry.swapCount,
            totalCollections: Object.keys(nftCollections).length,
            subname: foundSubnames.length > 0 ? foundSubnames[0].name : "",
          };

        } catch (error) {
          logger.error(`Error fetching NFTs for wallet ${entry.address}:`, error.message);
          return {
            ...formattedUser,
            wallet: user.wallet || entry.address,
            totalSwaps: entry.swapCount,
            totalCollections: 0,
            subname: foundSubnames.length > 0 ? foundSubnames[0].name : "",
          };
        }


      })
    );

    return res.status(200).json({
      success: true,
      message: "Top 10 traders fetched successfully.",
      data: responseData
    });

  } catch (err) {
    handleError(res, err, "list_top_traders: error");
  }
}


// Helper functions - start here
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

const getFormattedUserDetails = (userData) => {
  return ({
    ...userData,
    images: tryParseJSON(userData.images),
    social_links: tryParseJSON(userData.social_links),
    tags: tryParseJSON(userData.tags),
    points: tryParseJSON(userData.points)
  });
};

export const userController = {
  create_user,
  get_user_twitter_access_by_wallet,
  update_user_points,
  get_user_by_wallet,
  edit_user_profile,
  test_aa_address_using_key,
  create_user_platform_wallet,
  list_new_members,
  list_top_traders
};