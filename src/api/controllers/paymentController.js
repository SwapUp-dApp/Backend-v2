import { isExpiredWebhook, isValidWebhookSignature } from "../utils/helpers";
import { SUE_PaymentMode, SUE_PurchaseType } from "../utils/constants";
import db from "../../database/models";
import Environment from "../../config";
import logger from "../../logger";
import { CustomError, handleError } from "../../errors";
import { handleCheckSubnameAvailability, handleMintNewSubname } from "../utils/subnameMinting";

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

    let paymentRecordSavedResponse = null;
    let customMessage = '';

    // Hint: Visit the following links to view types
    // BuyWithCryptoStatus: https://portal.thirdweb.com/references/typescript/v5/BuyWithCryptoStatus
    // BuyWithFiatStatus: https://portal.thirdweb.com/references/typescript/v5/BuyWithFiatStatus

    if (!(paymentData.status === "COMPLETED" || paymentData.status === "ON_RAMP_TRANSFER_COMPLETED" || paymentData.status === "CRYPTO_SWAP_COMPLETED")) {
      throw new CustomError(202, "Transaction is not completed yet!");
    }

    const { environmentId, environmentKey } = paymentData.purchaseData.paymentTriggeredFrom;

    //Same Environment - check if payment triggered from same environment, if not then return res with message
    if ((Environment.NETWORK_ID !== Number(environmentId)) && (Environment.ENVIRONMENT_KEY.toLocaleLowerCase() !== environmentKey.toLocaleLowerCase())) {
      customMessage = `Transaction results triggered from ${environmentKey} environment cannot be saved in ${Environment.ENVIRONMENT_KEY} environment.`;

      logger.warn(customMessage);

      res.status(202).json({
        success: true,
        message: customMessage,
        data: paymentRecordSavedResponse
      });
    }

    // 1. Check for subname payment
    if (paymentData.purchaseData.purchaseType === SUE_PurchaseType.SUBNAME) {
      const subnamePurchaseData = paymentData.purchaseData.details.subname;

      // If the Payment is completed but buyer does not own the subname
      try {
        // Add a delay of, e.g., 10 seconds
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        // Wait for the delay before proceeding
        await delay(10000);


        // Step-1: get the subname availability
        const isAvailable = await handleCheckSubnameAvailability(subnamePurchaseData.subnameLabel, subnamePurchaseData.domain, SUE_PaymentMode.CRYPTO_OR_CARD);

        // Step-2: If available, mint the subname for user
        if (isAvailable) {
          const mintRes = await handleMintNewSubname(subnamePurchaseData.subnameLabel, subnamePurchaseData.buyerAddress);
          logger.info(`Webhook: User ${subnamePurchaseData.buyerAddress} has successfully minted ${subnamePurchaseData.subnameLabel}. `, mintRes);
        }

      } catch (error) {
        logger.error("Error checking subname availability: ", error.message);
      }

      // Create new record in Payments table with data in subnamePurchase column
      paymentRecordSavedResponse = await db.payments.create({
        paidBy: paymentData.fromAddress,
        subnamePurchase: JSON.stringify(paymentData)
      });

      customMessage = "Subname purchase data saved.";
    }

    // 2. Check for crypto payment
    else if (paymentData.purchaseData.purchaseType === SUE_PurchaseType.CRYPTO) {
      // Create new record in Payments table with data in cryptoPurchase column
      paymentRecordSavedResponse = await db.payments.create({
        paidBy: paymentData.fromAddress,
        cryptoPurchase: JSON.stringify(paymentData)
      });

      customMessage = "Crypto purchase data saved.";
    }

    // 3. Check for subscription payment
    else if (paymentData.purchaseData.purchaseType === SUE_PurchaseType.SUBSCRIPTION) {
      // Create new record in Payments table with data in subscriptionPurchase column
      paymentRecordSavedResponse = await db.payments.create({
        paidBy: paymentData.fromAddress,
        subscriptionPurchase: JSON.stringify(paymentData)
      });

      customMessage = "Subscription purchase data saved.";
    }

    else {
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
