import express from "express"
import { nftController } from "../controllers/nftController.js"

export const nftRouter = express.Router()

nftRouter.get("/", nftController.test)
nftRouter.get("/:walletId", nftController.list_all_wallet_nfts)
