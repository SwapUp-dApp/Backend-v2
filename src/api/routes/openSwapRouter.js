import express from 'express';
import { openSwapController } from '../controllers/openSwapController';

export const openSwapRouter = express.Router();

openSwapRouter
    .post("/create", openSwapController.createOpenSwap)
    .get("/list", openSwapController.getOpenSwapList)
    .get("/get-swap", openSwapController.getSwapPreferences)
    .post("/propose", openSwapController.proposeOpenSwap)
    .patch("/close-offers", openSwapController.closeOpenSwapOffers)
    .patch("/accept", openSwapController.acceptOpenSwap);
