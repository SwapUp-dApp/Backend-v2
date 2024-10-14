import express from "express";
import { paymentController } from "../controllers/paymentController";

export const paymentRouter = express.Router();


paymentRouter
  .get("/", paymentController.test)
  .post("/webhook", paymentController.payment_success_webhook);