"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.walletRouter = void 0;
var _express = _interopRequireDefault(require("express"));
var _walletController = require("../controllers/walletController.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const walletRouter = _express.default.Router();
exports.walletRouter = walletRouter;
walletRouter.get('/', _walletController.walletController.list_all_wallets).post('/', _walletController.walletController.create_wallet);
//# sourceMappingURL=walletRoutes.js.map