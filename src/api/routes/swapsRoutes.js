import express from "express"
import { swapController } from "../controllers/swapController.js"

export const swapRouter = express.Router()

swapRouter
    .post("/", swapController.newSwap)
    .put("/", swapController.updateSwap)
    .patch("/status", swapController.updateSwapStatus)
    .get("/history", swapController.history)
    .get("/pending", swapController.getPending)
    .post("/signature",swapController.sendSign)
    .get("/", swapController.getSwapDetails)
