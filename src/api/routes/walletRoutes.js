import express from "express"
import { walletController } from "../controllers/walletController.js"

export const walletRouter = express.Router()

walletRouter
  .get(
    "/token-breakdown/:walletId",
    walletController.token_breakdown_against_wallet
  )
  .get(
    "/encrypt-wallet-address/:address",
    walletController.encryptWalletAddress
  )
  .get(
    "/decrypt-wallet-address/:address",
    walletController.decryptWalletAddress
  )
  .get("/test", walletController.test)
