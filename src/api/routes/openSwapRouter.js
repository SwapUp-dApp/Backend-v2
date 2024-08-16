import express from 'express';
import { openSwapController } from '../controllers/openSwapController';

export const openSwapRouter = express.Router();

openSwapRouter
    .post("/create", openSwapController.createOpenSwap)
    .get("/list", openSwapController.getOpenSwapList)
    .get("/get-swap", openSwapController.getSwapPreferences)
    .get("/get-swap-by-id", openSwapController.getSwapObject)
    .get("/myopenswaps", openSwapController.getMyOpenSwapList)
    .post("/propose", openSwapController.proposeOpenSwap)
    .patch("/cancel", openSwapController.cancelSwapOffer)
    .patch("/reject-swap", openSwapController.rejectSwapOffer)
    .patch("/accept", openSwapController.acceptOpenSwap);
