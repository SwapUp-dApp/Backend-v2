const { default: db } = require("../../database/models");
const { default: logger } = require("../../logger");
const { SwapStatus, SUE_ProfileTags } = require("./constants");
const { tryParseJSON } = require("./helpers");

const updateUserTagsIfFirstTrade = async (db, initAddress, acceptAddress, transaction) => {
  // Fetch both init_address and accept_address users
  const [initUser, acceptUser] = await Promise.all([
    db.users.findOne({ where: { wallet: initAddress }, transaction }),
    db.users.findOne({ where: { wallet: acceptAddress }, transaction })
  ]);

  // Helper function to update tags
  const updateTags = async (user) => {
    if (user) {
      // Check if the user has completed any other swaps before this one
      const completedSwapsCount = await db.swaps.count({
        where: {
          [db.Sequelize.Op.or]: [
            { init_address: user.wallet },
            { accept_address: user.wallet }
          ],
          status: SwapStatus.COMPLETED
        },
        transaction
      });

      // logger.info("Completed Swaps count: ", completedSwapsCount);

      // If it's their first completed swap and they have the "normie" tag
      if (completedSwapsCount === 0 || completedSwapsCount === 1) {
        let userTags = tryParseJSON(user.tags) || [];

        if (userTags.includes(SUE_ProfileTags.NORMIE)) {
          userTags = userTags.filter(tag => tag !== SUE_ProfileTags.NORMIE);
          userTags.push(SUE_ProfileTags.TRADER);

          // logger.info("User Tags after update: ", userTags);
          // Update user's tags
          await user.update({ tags: JSON.stringify(userTags) }, { transaction });
        }
      }
    }
  };

  // Update tags for both users
  await Promise.all([
    updateTags(initUser),
    updateTags(acceptUser)
  ]);
};

const updateUserTagsIfFirstSubnameMinted = async (walletAddress) => {
  const user = await db.users.findOne({ where: { wallet: walletAddress } });
  if (user) {
    let userTags = tryParseJSON(user.tags) || [];

    if (!userTags.includes(SUE_ProfileTags.COMMUNITY_MEMBER)) {
      userTags = userTags.filter(tag => tag !== SUE_ProfileTags.NORMIE);
      userTags.push(SUE_ProfileTags.COMMUNITY_MEMBER);
      await user.update({ tags: JSON.stringify(userTags) });
      logger.info("User Tags after update: ", userTags);
    }
  }
};


module.exports = {
  updateUserTagsIfFirstTrade,
  updateUserTagsIfFirstSubnameMinted
};
