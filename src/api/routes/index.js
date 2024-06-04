import express from "express"

import { walletRouter } from "./walletRoutes.js"
import { nftRouter } from "./nftRoutes.js"
import { swapRouter } from "./swapsRoutes.js"

const apiRouter = express.Router()

apiRouter.use("/nfts", nftRouter)
apiRouter.use("/wallets", walletRouter)
apiRouter.use("/swaps", swapRouter)

export default apiRouter
