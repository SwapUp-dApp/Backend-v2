"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.walletController = void 0;
var _models = _interopRequireDefault(require("../../database/models"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function list_all_wallets(req, res) {
  try {
    let getdata = await _models.default.users.findAll(req.body);
    if (getdata) {
      res.json({
        success: true,
        message: "list_all_wallets",
        data: getdata
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: `***list_all_wallets -> ${err}`
    });
  }
}
async function create_wallet(req, res) {
  let walletAddress = req.body.walletAddress;
  try {
    let checkdata = await _models.default.users.findOne({
      where: {
        wallet: walletAddress
      }
    });
    if (checkdata) {
      res.json({
        message: `create_wallet: ${walletAddress} already exists`,
        data: checkdata
      });
    } else {
      let createdata = await _models.default.users.create({
        wallet: walletAddress
      });
      if (createdata) {
        res.json({
          success: true,
          message: `create_wallet: ${walletAddress}`,
          data: createdata
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: `create_wallet: ${walletAddress} -> ${err}`
    });
  }
}
const walletController = {
  list_all_wallets,
  create_wallet
};
exports.walletController = walletController;
//# sourceMappingURL=walletController.js.map