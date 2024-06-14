import express from "express"
 
import { walletRouter } from "./walletRoutes.js"
import { nftRouter } from "./nftRoutes.js"
import { swapRouter } from "./swapsRoutes.js"
import { openSwapRouter } from './openSwapRouter.js';


const apiRouter = express.Router()

apiRouter.use("/nfts", nftRouter)
apiRouter.use("/wallets", walletRouter)
apiRouter.use("/swaps", swapRouter)
apiRouter.use('/openswap', openSwapRouter)

export default apiRouter
