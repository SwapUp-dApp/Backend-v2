import express from "express"
import { swapController } from "../controllers/swapController.js"

export const swapRouter = express.Router()

swapRouter
    .post("/", swapController.newSwap)
    .put("/", swapController.updateSwap)
    .patch("/status", swapController.updateSwapStatus)
    .get("/history", swapController.history)
    .get("/pending", swapController.getPending)
    .get("/pendingswaps", swapController.getPendingSwaps)
    .get("/private-swaplist", swapController.getPrivatePending)
    .post("/signature",swapController.sendSign)
    .get("/", swapController.getSwapDetails)

    // open swaps 
    .post("/openswap/" , swapController.newSwap)
    .put("/openswap/" , swapController.newSwap)
    .delete("/openswap/" , swapController.newSwap)

    .get("/openswap/getOpenSwapList" , swapController.newSwap)
    .get("/openswap/proposeOpenSwap" , swapController.newSwap)
    .get("/openswap/closeOpenSwapoffers" , swapController.newSwap)
    .get("/openswap/acceptOpenSwap" , swapController.newSwap)