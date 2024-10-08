import express from "express";
import { swapController } from "../controllers/swapController.js";

export const swapRouter = express.Router();

swapRouter
    .post("/", swapController.newSwap)
    .patch("/counter-offer", swapController.counterSwapOffer)
    .patch("/status", swapController.updateSwapStatus)
    .get("/history", swapController.history)
    .get("/pending", swapController.getPending)
    .get("/pendingswaps", swapController.getPendingSwaps)
    .get("/swapshistory", swapController.getSwapHistory)
    .get("/private-swaplist", swapController.getPrivatePending)
    .get("/get-swap-details/:trade_or_open_trade_id", swapController.getSwapDetails)
    .post("/signature", swapController.sendSign)
    .patch("/accept", swapController.acceptPrivateSwap)

    // open swaps 
    .post("/openswap/", swapController.newSwap)
    .put("/openswap/", swapController.newSwap)
    .delete("/openswap/", swapController.newSwap)

    .get("/openswap/getOpenSwapList", swapController.newSwap)
    .get("/openswap/proposeOpenSwap", swapController.newSwap)
    .get("/openswap/closeOpenSwapoffers", swapController.newSwap)
    .get("/openswap/acceptOpenSwap", swapController.newSwap);