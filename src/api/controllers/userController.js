import db from "../../database/models";
import { tryParseJSON } from "../utils/helpers";

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
      defaults: { wallet: walletId }
    });

    if (created) {
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
    console.error(`Error creating user with wallet ID ${walletId}:`, err);
    return res.status(500).json({
      success: false,
      message: `An error occurred while processing your request.`,
      error: err.message
    });
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
    console.error(`get_user_twitter_access_by_wallet: Error getting twitter access`, err);
    return res.status(500).json({
      success: false,
      message: `An error occurred while processing your request.`,
      error: err.message
    });
  }
}

function test(req, res) {
  res.send({ network: process.env.NETWORK, message: "SwapUp user test route" });
}

export const userController = { list_all_users, create_user, test, get_user_twitter_access_by_wallet };