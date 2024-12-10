import db from "../../database/models";
import logger from "../../logger";
import { handleError } from "../../errors";

async function add_new_subscription_token(req, res) {
  try {
    const { address, name, symbol, iconUrl, chainId, usdAmount, tradeCharges } = req.body;

    if (!address || !name || !symbol || !chainId || !usdAmount || !tradeCharges) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: address, name, symbol, chainId, usdAmount, tradeCharges",
      });
    }

    const newToken = await db.subscriptionTokens.create({
      address,
      name,
      symbol,
      iconUrl,
      chainId,
      usdAmount,
      tradeCharges,
    });

    logger.info("New subscription token added to the database: ", newToken);

    return res.status(201).json({
      success: true,
      message: "New subscription token added to the database",
      data: newToken,
    });
  } catch (err) {
    handleError(res, err, "add_new_subscription_token: error");
  }
}

async function update_subscription_token(req, res) {
  try {
    const { id } = req.params; // UUID of the token
    const { address, name, symbol, iconUrl, chainId, usdAmount, tradeCharges } = req.body;

    const token = await db.subscriptionTokens.findByPk(id);

    if (!token) {
      return res.status(404).json({
        success: false,
        message: "Subscription token not found",
      });
    }

    const updatedToken = await token.update({
      address,
      name,
      symbol,
      iconUrl,
      chainId,
      usdAmount,
      tradeCharges,
    });

    logger.info("Subscription token updated successfully: ", updatedToken);

    return res.status(200).json({
      success: true,
      message: "Subscription token updated successfully",
      data: updatedToken,
    });
  } catch (err) {
    handleError(res, err, "update_subscription_token: error");
  }
}


async function delete_subscription_token(req, res) {
  try {
    const { id } = req.params; // UUID of the token

    const token = await db.subscriptionTokens.findByPk(id);

    if (!token) {
      return res.status(404).json({
        success: false,
        message: "Subscription token not found",
      });
    }

    await token.destroy();

    return res.status(200).json({
      success: true,
      message: "Subscription token deleted successfully",
    });
  } catch (err) {
    handleError(res, err, "delete_subscription_token: error");
  }
}

async function get_subscription_tokens(req, res) {
  try {
    const { chainId } = req.query;
    // Build query filters based on provided parameters
    const filters = {};
    let foundResult;

    if (chainId) {
      filters.chainId = chainId;
      foundResult = await db.subscriptionTokens.findOne({
        where: filters,
      });
    } else {
      foundResult = await db.subscriptionTokens.findAll();
    }


    return res.status(200).json({
      success: true,
      message: "Subscription tokens retrieved successfully",
      data: foundResult,
    });
  } catch (err) {
    handleError(res, err, "get_subscription_tokens: error");
  }
}

export const manageController = {
  add_new_subscription_token,
  update_subscription_token,
  delete_subscription_token,
  get_subscription_tokens
};
