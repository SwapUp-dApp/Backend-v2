import db from "../../database/models";
import { Op } from "sequelize";
import { handleError, isExpiredWebhook, isValidWebhookSignature, tryParseJSON } from "../utils/helpers";
import CustomError from "../../errors/customError";

const WEBHOOK_SECRET = process.env.THIRDWEB_PAYMENT_WEBHOOK_SECRET_KEY;

function test(req, res) {
  res.send({ network: process.env.NETWORK });
}

async function payment_success_webhook(req, res) {
  try {
    const signatureFromHeader = req.header("X-Pay-Signature");
    const timestampFromHeader = req.header("X-Pay-Timestamp");

    if (!signatureFromHeader || !timestampFromHeader) {
      throw new CustomError(401, "Missing signature or timestamp header");
    }

    const isValidSign = isValidWebhookSignature(req.body, timestampFromHeader, signatureFromHeader, WEBHOOK_SECRET);

    console.log("Incoming request: ", req.body);
    console.log("Content-Type: ", req.header("Content-Type"));
    console.log("timestampFromHeader: ", timestampFromHeader);
    console.log("signatureFromHeader: ", signatureFromHeader);
    console.log("WEBHOOK_SECRET: ", WEBHOOK_SECRET);
    console.log("isValidSign: ", isValidSign);

    // Use req.rawBody for signature validation, not req.body
    if (!isValidSign) {
      throw new CustomError(401, "Invalid signature");
    }

    if (isExpiredWebhook(timestampFromHeader, 300)) {
      // Assuming expiration time is 5 minutes (300 seconds)
      throw new CustomError(401, "Missing signature or timestamp header");
    }

    // Process the request
    res.status(200).send("Webhook received!");
  } catch (err) {
    handleError(res, err, "payment_success_webhook: error");
  }
}


export const paymentController = {
  test,
  payment_success_webhook
};
