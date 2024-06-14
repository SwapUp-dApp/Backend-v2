"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAlchemy = getAlchemy;
var _alchemySdk = require("alchemy-sdk");
function getAlchemy() {
  // Optional Config object, but defaults to demo api-key and eth-mainnet.
  const settings = {
    apiKey: process.env.ALCHEMY_KEY,
    // Replace with your Alchemy API Key.
    network: process.env.NETWORK === "1" ? _alchemySdk.Network.ETH_MAINNET : _alchemySdk.Network.ETH_SEPOLIA // Replace with your network.
  };

  return new _alchemySdk.Alchemy(settings);
}
//# sourceMappingURL=alchemy.js.map