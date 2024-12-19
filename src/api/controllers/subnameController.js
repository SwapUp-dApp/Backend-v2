import { CustomError, handleError } from "../../errors";
import logger from "../../logger";
import { handleGetMintSubnameTransactionParams, handleMintNewSubname } from "../utils/subnameMinting";


async function mint_subname(req, res) {
  try {
    const minterAddress = req.params.minterAddress;
    const { subnameLabel } = req.body;

    if (!minterAddress || !subnameLabel) {
      throw new CustomError(400, "Minter address and subname label are required.");
    }

    const mintRes = await handleMintNewSubname(subnameLabel, minterAddress);

    // Log the transaction and respond with success
    logger.info(`User ${minterAddress} has successfully minted ${subnameLabel}.`);
    return res.status(201).json({
      success: true,
      message: `User ${minterAddress} has successfully minted ${subnameLabel}.`,
      data: mintRes,
    });
  } catch (err) {
    handleError(res, err, "mint_subname: error");
  }
}


async function get_subname_mint_Params(req, res) {
  try {
    const { minterAddress, subnameLabel } = req.query;

    if (!minterAddress || !subnameLabel) {
      throw new CustomError(400, "Minter address and subname label are required.");
    }

    const transactionParams = await handleGetMintSubnameTransactionParams(subnameLabel, minterAddress);

    return res.status(201).json({
      success: true,
      message: `Successfully able to collect mint params for ${subnameLabel}`,
      transaction: "transactionParams",
    });
  } catch (err) {
    handleError(res, err, "get_subname_mint_Params: error");
  }
}

export const subnameController = {
  mint_subname,
  get_subname_mint_Params
};