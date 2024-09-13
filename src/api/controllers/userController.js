import db from "../../database/models";
import { handleError, tryParseJSON } from "../utils/helpers";

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
    console.log(err);
    res.status(500).json({
      success: false,
      message: `***list_all_users -> ${err}`
    });
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
        points: points,
        social_links: JSON.stringify({ twitter: '', warpcast: '' }),
        tags: JSON.stringify(tags)
      }
    });

    // Format the user object before sending the response, excluding twitter_access
    const { twitter_access, ...restUserData } = user.dataValues;
    const formattedUser = {
      ...restUserData,
      images: tryParseJSON(restUserData.images),
      social_links: tryParseJSON(restUserData.social_links),
      tags: tryParseJSON(restUserData.tags)
    };

    if (created) {
      console.log("Created user: ", formattedUser);

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
    const { pointsToAdd, counterPartyWalletId } = req.body;

    // Ensure pointsToAdd is a valid number
    if (typeof pointsToAdd !== 'number' || isNaN(pointsToAdd)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid points value provided.'
      });
    }
    // Update points for the main user
    const updatedPoints = await updateUserPointsByWallet(walletId, pointsToAdd);

    // Update points for the counterpart user, if provided
    let updatedCounterPartPoints = null;

    if (counterPartyWalletId) {
      updatedCounterPartPoints = await updateUserPointsByWallet(counterPartyWalletId, pointsToAdd);
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
    const formattedUser = {
      ...restUserData,
      images: tryParseJSON(restUserData.images),
      social_links: tryParseJSON(restUserData.social_links),
      tags: tryParseJSON(restUserData.tags)
    };

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
    const formattedUser = {
      ...restUserData,
      images: tryParseJSON(restUserData.images),
      social_links: tryParseJSON(restUserData.social_links),
      tags: tryParseJSON(restUserData.tags)
    };

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
  res.send({ network: process.env.NETWORK, message: "SwapUp user test route" });
}

// Helper functions

async function updateUserPointsByWallet(walletId, pointsToAdd) {
  // Find the user by wallet ID
  const user = await db.users.findOne({ where: { wallet: walletId } });

  if (!user) {
    throw new Error(`User with wallet ID ${walletId} not found.`);
  }

  // Add points to the current points
  if (typeof pointsToAdd !== 'number' || isNaN(pointsToAdd)) {
    throw new Error('Invalid points value provided.');
  }

  user.points += pointsToAdd;

  // Save the updated points in the database
  await user.save();

  return user.points;
}


export const userController = {
  list_all_users,
  create_user,
  get_user_twitter_access_by_wallet,
  update_user_points,
  get_user_by_wallet,
  edit_user_profile
};