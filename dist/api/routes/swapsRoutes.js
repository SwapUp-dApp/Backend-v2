"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.swapRouter = void 0;
var _express = _interopRequireDefault(require("express"));
var _swapController = require("../controllers/swapController.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const swapRouter = _express.default.Router();
exports.swapRouter = swapRouter;
swapRouter.post("/", _swapController.swapController.newSwap).put("/", _swapController.swapController.updateSwap).patch("/status", _swapController.swapController.updateSwapStatus).get("/history", _swapController.swapController.history).get("/pending", _swapController.swapController.getPending).post("/signature", _swapController.swapController.sendSign).get("/", _swapController.swapController.getSwapDetails);
//# sourceMappingURL=swapsRoutes.js.map