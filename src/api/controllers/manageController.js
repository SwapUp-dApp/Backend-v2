import db from "../../database/models";
import logger from "../../logger";
import { CustomError, handleError } from "../../errors";

// Manage subscription tokens table endpoint functions starts here
async function add_new_subscription_token(req, res) {
  try {
    const { address, name, symbol, iconUrl, chainId, usdAmount, tradeCharges, subnameCharges } = req.body;

    if (!address || !name || !symbol || !chainId || !usdAmount || !tradeCharges || !subnameCharges) {
      throw new CustomError(404, "Missing required fields: address, name, symbol, chainId, usdAmount, tradeCharges and subnameCharges");
    }

    const newToken = await db.subscriptionTokens.create({
      address,
      name,
      symbol,
      iconUrl,
      chainId,
      usdAmount,
      tradeCharges,
      subnameCharges
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
    const { address, name, symbol, iconUrl, chainId, usdAmount, tradeCharges, subnameCharges } = req.body;

    const token = await db.subscriptionTokens.findByPk(id);

    if (!token) {
      throw new CustomError(404, "Subscription token not found");
    }

    const updatedToken = await token.update({
      address,
      name,
      symbol,
      iconUrl,
      chainId,
      usdAmount,
      tradeCharges,
      subnameCharges
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
      throw new CustomError(404, "Subscription token not found");
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
// Manage subscription tokens table endpoint functions ends here

// Manage subname access table endpoint functions starts here
async function add_new_subname_access(req, res) {
  try {
    const { address, listedName, chainId, accessToken, refreshToken } = req.body;

    if (!address || !listedName || !chainId || !accessToken || !refreshToken) {
      throw new CustomError(400, "Missing required fields: address, listedName, chainId, accessToken, refreshToken");
    }

    // Check if an entry with the same address and chainId already exists
    const existingAccess = await db.subnameAccess.findOne({
      where: {
        address,
        chainId,
        listedName
      },
    });

    if (existingAccess) {
      throw new CustomError(400, "An entry with this already exists.");
    }

    // Create a new entry if it doesn't exist
    const newAccess = await db.subnameAccess.create({
      address,
      listedName,
      chainId,
      accessToken,
      refreshToken,
    });

    return res.status(201).json({
      success: true,
      message: "New subname access token added to the database",
      data: newAccess,
    });
  } catch (err) {
    handleError(res, err, "add_new_subname_access: error");
  }
}

async function get_subname_access(req, res) {
  try {
    const { id, address, chainId } = req.query;

    if (!id && !address && !chainId) {
      throw new CustomError(400, "At least one of id, address, or chainId must be provided.");
    }

    const whereClause = {};
    if (id) whereClause.id = id;
    if (address) whereClause.address = address;
    if (chainId) whereClause.chainId = chainId;

    const accessData = await db.subnameAccess.findAll({ where: whereClause });

    if (!accessData.length) {
      return res.status(404).json({
        success: false,
        message: "No matching records found",
      });
    }

    return res.status(200).json({
      success: true,
      data: accessData,
    });
  } catch (err) {
    handleError(res, err, "get_subname_access: error");
  }
}

async function update_subname_access(req, res) {
  try {
    const { id } = req.params;
    const { address, listedName, chainId, accessToken, refreshToken } = req.body;

    if (!id) {
      throw new CustomError(400, "ID parameter is required.");
    }

    const [updatedRowsCount, updatedRows] = await db.subnameAccess.update(
      { address, listedName, chainId, accessToken, refreshToken },
      { where: { id }, returning: true }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching record found to update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subname access token updated successfully",
      data: updatedRows[0],
    });
  } catch (err) {
    handleError(res, err, "update_subname_access: error");
  }
}

async function remove_subname_access(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new CustomError(400, "ID parameter is required.");
    }

    const deletedRows = await db.subnameAccess.destroy({ where: { id } });

    if (deletedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching record found to delete",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subname access token deleted successfully",
    });
  } catch (err) {
    handleError(res, err, "remove_subname_access: error");
  }
}
// Manage subname access table endpoint functions ends here




export const manageController = {
  add_new_subscription_token,
  update_subscription_token,
  delete_subscription_token,
  get_subscription_tokens,
  add_new_subname_access,
  get_subname_access,
  update_subname_access,
  remove_subname_access
};
