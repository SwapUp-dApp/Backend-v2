import Environment from "../../config";
import db from "../../database/models";
import { handleError } from "../../errors";
import logger from "../../logger";
import { getNFTCollectionsByWalletId } from "../utils/nft";
import { Op, Sequelize } from "sequelize";
import { getBaseBlockscoutTokenByAddressApi, getCoinRankingCurrenciesApi, getSubnameListedOnL2Api } from "../../service/thirdparty.service";
import { getFormattedUserDetails } from "../utils/user";
import { SwapStatus } from "../utils/constants";
import { tryParseJSON } from "../utils/helpers";
import { convertBlockscoutToCoinRankingFormat } from "../utils/currencies";


async function list_new_subnames(req, res) {
  try {
    // Fetch the latest 5 users ordered by createdAt in descending order
    const latestSubnames = await db.subnames.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    return res.status(200).json({
      success: true,
      message: "Successfully got new subnames data.",
      data: latestSubnames
    });

  } catch (err) {
    handleError(res, err, "list_new_subnames: error");
  }
}

async function list_new_members(req, res) {
  try {
    // Fetch the latest 5 subnames ordered by createdAt in descending order
    const latestSubnames = await db.subnames.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    if (!latestSubnames || latestSubnames.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No subnames found.",
        data: []
      });
    }

    // Fetch users for each subnameOwner and process them
    const usersWithNFTs = await Promise.all(
      latestSubnames.map(async (subname) => {
        // Fetch user details by subnameOwner
        const user = await db.users.findOne({
          where: { wallet: subname.subnameOwner },
          attributes: {
            exclude: ['twitter_access', 'privateKey', 'points', 'tags', 'social_links', 'updatedAt', 'description']
          }
        });

        if (!user) {
          return null; // Skip if no user is found
        }

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
            nftProfiles = nftCollections[collectionKeys[0]].slice(0, 3);
          } else if (collectionKeys.length === 2) {
            const firstCollectionNFTs = nftCollections[collectionKeys[0]].slice(0, 2);
            const secondCollectionNFTs = nftCollections[collectionKeys[1]].slice(0, 1);
            nftProfiles = [...firstCollectionNFTs, ...secondCollectionNFTs];
          } else {
            nftProfiles = collectionKeys.slice(0, 3).map((key) => nftCollections[key][0]);
          }

          return {
            ...formattedUser,
            avatar,
            nftProfiles,
            totalCollections: collectionKeys.length,
            membershipCreatedAt: subname.createdAt,
            subname: subname.subname
          };
        } catch (err) {
          logger.error(`Error fetching NFTs for wallet ${formattedUser.wallet}:`, err.message);
          return {
            ...formattedUser,
            avatar,
            nftProfiles: [],
            totalCollections: 0,
            membershipCreatedAt: subname.createdAt,
            subname: subname.subname
          };
        }
      })
    );

    // Filter out any null values (in case some users were not found)
    const filteredUsers = usersWithNFTs.filter(user => user !== null);

    return res.status(200).json({
      success: true,
      message: "Successfully got new members data.",
      data: filteredUsers
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

async function list_trending_token_pairs(req, res) {
  try {
    // Step 1: Fetch all completed swaps with necessary columns
    const completedSwaps = await db.swaps.findAll({
      where: {
        status: SwapStatus.COMPLETED,
        accept_address: { [Op.ne]: null },
      },
      attributes: ["metadata"],
    });

    // Step 2: Parse metadata and filter for ERC20 tokens
    const tokenPairs = [];

    completedSwaps.forEach((swap) => {
      const metadata = tryParseJSON(swap.metadata);
      if (metadata && metadata.init && metadata.accept) {
        const initTokens = metadata.init.tokens.filter(
          (token) => token.type === "ERC20"
        );
        const acceptTokens = metadata.accept.tokens.filter(
          (token) => token.type === "ERC20"
        );

        // Generate pairs of (init_token, accept_token)
        initTokens.forEach((initToken) => {
          acceptTokens.forEach((acceptToken) => {
            tokenPairs.push({
              pair: {
                init: {
                  address: initToken.address,
                  type: initToken.type,
                  image_url: initToken.image_url,
                  symbol: initToken.value?.symbol || "N/A",
                },
                accept: {
                  address: acceptToken.address,
                  type: acceptToken.type,
                  image_url: acceptToken.image_url,
                  symbol: acceptToken.value?.symbol || "N/A",
                },
              },
            });
          });
        });
      }
    });

    // Step 3: Count occurrences of each token pair
    const pairCounts = {};

    tokenPairs.forEach(({ pair }) => {
      const pairKey = `${pair.init.address}:${pair.init.type}|${pair.accept.address}:${pair.accept.type}`;
      if (pairCounts[pairKey]) {
        pairCounts[pairKey].count++;
      } else {
        pairCounts[pairKey] = {
          count: 1,
          pair, // Store the pair details for later use
        };
      }
    });

    // Step 4: Sort token pairs by count and get the top 10
    const topTokenPairs = Object.values(pairCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(({ count, pair }) => ({
        init: pair.init,
        accept: pair.accept,
        count,
      }));

    // Step 5: Send response
    return res.status(200).json({
      success: true,
      message: "Top 10 trending token pairs fetched successfully.",
      data: topTokenPairs,
    });
  } catch (err) {
    handleError(res, err, "list_trending_token_pairs: error");
  }
}

async function list_trending_tokens(req, res) {
  try {
    // Step 1: Fetch all completed swaps with necessary columns
    const completedSwaps = await db.swaps.findAll({
      where: {
        status: SwapStatus.COMPLETED,
        accept_address: { [Op.ne]: null },
      },
      attributes: ["metadata", "trading_chain"],
    });

    // Step 2: Parse metadata and filter for ERC20 tokens
    const tokens = [];

    completedSwaps.forEach((swap) => {
      const metadata = tryParseJSON(swap.metadata);
      if (metadata && metadata.init && metadata.accept) {
        const initTokens = metadata.init.tokens.filter(
          (token) => token.type === "ERC20"
        );
        const acceptTokens = metadata.accept.tokens.filter(
          (token) => token.type === "ERC20"
        );

        // Collect tokens from both init and accept sides
        tokens.push(
          ...initTokens.map((token) => ({
            address: token.address,
            type: token.type,
            image_url: token.image_url,
            symbol: token.value?.symbol || "N/A",
            trading_chain: Number(swap.trading_chain),
          })),
          ...acceptTokens.map((token) => ({
            address: token.address,
            type: token.type,
            image_url: token.image_url,
            symbol: token.value?.symbol || "N/A",
            trading_chain: Number(swap.trading_chain),
          }))
        );
      }
    });

    // Step 3: Count occurrences of each token
    const tokenCounts = {};

    tokens.forEach((token) => {
      const tokenKey = `${token.address}:${token.type}`;
      if (tokenCounts[tokenKey]) {
        tokenCounts[tokenKey].count++;
      } else {
        tokenCounts[tokenKey] = {
          count: 1,
          token, // Store token details for later use
        };
      }
    });

    // Step 4: Sort tokens by count and get the top 10
    const topTokens = Object.values(tokenCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(({ count, token }) => ({
        ...token,
        tokenAppearance: count,
      }));

    // Step 5: Fetch additional information for each token
    const ethAddresses = [];
    const baseAddresses = [];
    const additionalInfo = [];

    topTokens.forEach((token) => {
      if (token.trading_chain === 8453) {
        baseAddresses.push(token.address);
      } else {
        ethAddresses.push(token.address);
      }
    });

    // Fetch Ethereum token details
    if (ethAddresses.length > 0) {
      const ethCurrenciesRes = await getCoinRankingCurrenciesApi({
        blockchains: ["ethereum"],
        contractAddresses: ethAddresses
      });
      additionalInfo.push(...ethCurrenciesRes.data.data.coins);
    }

    // Fetch Base token details
    if (baseAddresses.length > 0) {
      const baseCurrenciesRes = await getCoinRankingCurrenciesApi({
        blockchains: ["base"],
        contractAddresses: baseAddresses,
      });

      const baseTokensFromCoinRanking = baseCurrenciesRes.data.data.coins || [];
      const missingBaseAddresses = baseAddresses.filter(
        (address) =>
          !baseTokensFromCoinRanking.some((coin) =>
            coin.contractAddresses.some((contract) =>
              contract.includes(address.toLowerCase())
            )
          )
      );

      // Fetch missing tokens from BaseBlockscout API
      const additionalBaseTokens = await Promise.all(
        missingBaseAddresses.map(async (address) => {
          const tokenData = await getBaseBlockscoutTokenByAddressApi(address);
          return convertBlockscoutToCoinRankingFormat(tokenData.data.symbol, tokenData.data);
        })
      );

      additionalInfo.push(...baseTokensFromCoinRanking, ...additionalBaseTokens);
    }


    // Step 6: Merge additional data
    const finalTokens = topTokens.map((token) => {
      const additionalData = additionalInfo.find((info) =>
        info.contractAddresses.some((contractAddress) =>
          contractAddress.includes(token.address.toLowerCase())
        )
      );

      return {
        ...token,
        additionalData: additionalData || null,
      };
    });

    // Step 7: Send response
    return res.status(200).json({
      success: true,
      message: "Top 10 trending tokens with additional info fetched successfully.",
      data: finalTokens,
    });
  } catch (err) {
    handleError(res, err, "list_trending_tokens: error");
  }
}

export const analyticsController = {
  list_new_members,
  list_top_traders,
  list_trending_token_pairs,
  list_trending_tokens,
  list_new_subnames
};