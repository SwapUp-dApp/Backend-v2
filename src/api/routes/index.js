import express from "express";

import { walletRouter } from "./walletRoutes.js";
import { nftRouter } from "./nftRoutes.js";
import { swapRouter } from "./swapsRoutes.js";
import { openSwapRouter } from './openSwapRouter.js';
import { twitterRouter } from "./twitterRouter.js";


const apiRouter = express.Router();

apiRouter.use("/nfts", nftRouter);
apiRouter.use("/swaps", swapRouter);
apiRouter.use('/openswap', openSwapRouter);
apiRouter.use("/wallet", walletRouter);
apiRouter.use("/twitter", twitterRouter);

export default apiRouter;
