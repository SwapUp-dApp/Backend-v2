"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _walletRoutes = require("./walletRoutes.js");
var _nftRoutes = require("./nftRoutes.js");
var _swapsRoutes = require("./swapsRoutes.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const apiRouter = _express.default.Router();
apiRouter.use("/nfts", _nftRoutes.nftRouter);
apiRouter.use("/wallets", _walletRoutes.walletRouter);
apiRouter.use("/swaps", _swapsRoutes.swapRouter);
var _default = apiRouter;
exports.default = _default;
//# sourceMappingURL=index.js.map