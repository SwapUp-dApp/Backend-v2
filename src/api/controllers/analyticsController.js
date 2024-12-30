import Environment from "../../config";
import db from "../../database/models";
import { handleError } from "../../errors";
import logger from "../../logger";
import { getNFTCollectionsByWalletId } from "../utils/nft";
import { Op, Sequelize } from "sequelize";
import { getSubnameListedOnL2Api } from "../../service/thirdparty.service";
import { getFormattedUserDetails } from "../utils/user";
import { SwapStatus } from "../utils/constants";


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
          return { ...formattedUser, avatar, nftProfiles: [], totalCollections: 0, membershipCreatedAt: "" };
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
      where: { status: SwapStatus.COMPLETED, accept_address: { [Sequelize.Op.ne]: null } },
      attributes: [
        "init_address",
        [Sequelize.fn("COUNT", Sequelize.col("init_address")), "swapCount"]
      ],
      group: ["init_address"]
    });

    const acceptCounts = await db.swaps.findAll({
      where: { status: SwapStatus.COMPLETED, accept_address: { [Sequelize.Op.ne]: null } },
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

export const analyticsController = {
  list_new_members,
  list_top_traders
};