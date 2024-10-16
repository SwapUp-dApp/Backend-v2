import { isExpiredWebhook, isValidWebhookSignature, tryParseJSON } from "../utils/helpers";
import { SUE_PurchaseType } from "../utils/constants";
import { checkOffchainSubnameAvailabilityApi, mintOffchainSubnameApi } from "../../service/thirdparty.service";
import { DTO_MintNewOffchainSubnamePayload } from "../utils/dtos";
import db from "../../database/models";
import Environment from "../../config";
import logger from "../../logger";
import { CustomError, handleError } from "../../errors";

const WEBHOOK_SECRET = Environment.THIRDWEB_PAYMENT_WEBHOOK_SECRET_KEY;

function test(req, res) {
  res.send({ network: Environment.NETWORK_ID });
}

async function payment_success_webhook(req, res) {
  try {
    const signatureFromHeader = req.header("X-Pay-Signature");
    const timestampFromHeader = req.header("X-Pay-Timestamp");
    const requestData = req.body.data;

    if (!signatureFromHeader || !timestampFromHeader) {
      throw new CustomError(401, "Missing signature or timestamp header");
    }

    const isValidSign = isValidWebhookSignature(req.body, timestampFromHeader, signatureFromHeader, WEBHOOK_SECRET);

    // Use req.rawBody for signature validation, not req.body
    if (!isValidSign) {
      throw new CustomError(401, "Invalid signature");
    }

    if (isExpiredWebhook(timestampFromHeader, 300)) {
      // Assuming expiration time is 5 minutes (300 seconds)
      throw new CustomError(401, "Missing signature or timestamp header");
    }

    const paymentData = requestData.buyWithCryptoStatus || requestData.buyWithFiatStatus;

    // Hint: Visit the following links to view types
    // BuyWithCryptoStatus: https://portal.thirdweb.com/references/typescript/v5/BuyWithCryptoStatus
    // BuyWithFiatStatus: https://portal.thirdweb.com/references/typescript/v5/BuyWithFiatStatus

    if (!(paymentData.status === "COMPLETED" || paymentData.status === "ON_RAMP_TRANSFER_COMPLETED" || paymentData.status === "CRYPTO_SWAP_COMPLETED")) {
      throw new CustomError(202, "Transaction is not completed yet!");
    }

    let paymentRecordSavedResponse = null;
    let customMessage = '';

    // Check for subname payment
    if (paymentData.purchaseData.purchaseType === SUE_PurchaseType.SUBNAME) {
      const subnamePurchaseData = paymentData.purchaseData.details.subname;

      // If the Payment is completed but buyer does not own the subname
      // Step-1: get the subname availability
      let availabilityResponse;
      try {
        availabilityResponse = await checkOffchainSubnameAvailabilityApi(subnamePurchaseData.subnameLabel, subnamePurchaseData.domain);
        // logger.info("availabilityResponse.data: ", availabilityResponse.data);
      } catch (error) {
        logger.error("Error checking subname availability: ", error.message);
      }

      // Step-2: Check the subname availability and if available
      if (availabilityResponse.data.isAvailable) {
        // Step-3: If available mint this subname on behalf of buyer

        const mintSubnamePayload = DTO_MintNewOffchainSubnamePayload;
        mintSubnamePayload.address = subnamePurchaseData.buyerAddress;
        mintSubnamePayload.label = subnamePurchaseData.subnameLabel;
        mintSubnamePayload.domain = subnamePurchaseData.domain;

        try {
          const mintSubnameResponse = await mintOffchainSubnameApi(mintSubnamePayload);
          if (mintSubnameResponse.data) {
            logger.info("Manual subname minted on behalf of user: ", mintSubnameResponse.data);
          }
        } catch (error) {
          logger.error("Error minting subname: ", error.message);
        }
      }

      // Create new record in Payments table with data in subnamePurchase column
      paymentRecordSavedResponse = await db.payments.create({
        paidBy: paymentData.fromAddress,
        subnamePurchase: JSON.stringify(paymentData)
      });

      customMessage = "Subname purchase data saved.";
    }
    // Check for crypto payment
    else if (paymentData.purchaseData.purchaseType === SUE_PurchaseType.CRYPTO) {

      // Create new record in Payments table with data in cryptoPurchase column
      paymentRecordSavedResponse = await db.payments.create({
        paidBy: paymentData.fromAddress,
        cryptoPurchase: JSON.stringify(paymentData)
      });

      customMessage = "Crypto purchase data saved.";

    } else {
      paymentRecordSavedResponse = null;
      customMessage = "Unknown purchase type.";
    }

    logger.info("paymentRecordSavedResponse: ", paymentRecordSavedResponse);

    res.status(paymentRecordSavedResponse !== null ? 201 : 200).json({
      success: true,
      message: customMessage,
      data: paymentRecordSavedResponse
    });

  } catch (err) {
    handleError(res, err, "payment_success_webhook: error");
  }
}

export const paymentController = {
  test,
  payment_success_webhook
};
