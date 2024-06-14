"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.nftRouter = void 0;
var _express = _interopRequireDefault(require("express"));
var _nftController = require("../controllers/nftController.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const nftRouter = _express.default.Router();
exports.nftRouter = nftRouter;
nftRouter.get("/", _nftController.nftController.test);
nftRouter.get("/:walletId", _nftController.nftController.list_all_wallet_nfts);
//# sourceMappingURL=nftRoutes.js.map