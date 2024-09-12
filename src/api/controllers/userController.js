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
  const walletId = req.params.walletId;

  try {
    const [user, created] = await db.users.findOrCreate({
      where: { wallet: walletId },
      defaults: {
        wallet: walletId,
        images: JSON.stringify({ avatar: '', coverImage: '' }),
        points: 0,
        title: '',
        description: '',
        social_links: JSON.stringify({ twitter: '', warpcast: '' }),
        tags: JSON.stringify({
          normie: true,
          trader: false,
          collector: false,
          premium: false,
          "community-member": false
        })
      }
    });

    if (created) {
      console.log("Created user: ", user);

      return res.status(201).json({
        success: true,
        message: `User with wallet ID ${walletId} created successfully.`,
        data: user
      });
    } else {
      return res.status(200).json({
        success: true,
        message: `User with wallet ID ${walletId} already exists.`,
        data: user
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
  const { walletId } = req.params;
  const { pointsToAdd } = req.body;

  try {
    // Find the user by wallet ID
    const user = await db.users.findOne({ where: { wallet: walletId } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with wallet ID ${walletId} not found.`
      });
    }

    // Ensure pointsToAdd is a valid number
    if (typeof pointsToAdd !== 'number' || isNaN(pointsToAdd)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid points value provided.'
      });
    }

    // Add points to the current points
    const updatedPoints = user.points + pointsToAdd;

    // Update the user's points in the database
    user.points = updatedPoints;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Points updated successfully for user with wallet ID ${walletId}.`,
      data: { points: updatedPoints }
    });
  } catch (err) {
    handleError(res, err, "update_user_points: error");
  }
}


function test(req, res) {
  res.send({ network: process.env.NETWORK, message: "SwapUp user test route" });
}

export const userController = {
  list_all_users,
  create_user,
  get_user_twitter_access_by_wallet,
  update_user_points
};