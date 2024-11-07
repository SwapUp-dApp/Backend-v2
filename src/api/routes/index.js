import express from "express";

import { walletRouter } from "./walletRoutes.js";
import { nftRouter } from "./nftRoutes.js";
import { swapRouter } from "./swapsRoutes.js";
import { openSwapRouter } from './openSwapRouter.js';
import { twitterRouter } from "./twitterRouter.js";
import { userRouter } from "./userRouter.js";
import { paymentRouter } from "./paymentRouter.js";
import { treasuryRouter } from "./treasuryRouter.js";


const apiRouter = express.Router();

apiRouter
  .use("/nfts", nftRouter)
  .use("/swaps", swapRouter)
  .use('/openswap', openSwapRouter)
  .use("/wallet", walletRouter)
  .use("/twitter", twitterRouter)
  .use("/user", userRouter)
  .use("/payment", paymentRouter)
  .use("/treasury", treasuryRouter);

export default apiRouter;
