import { Network, Alchemy } from "alchemy-sdk";
import Environment from "../config";

const getCurrentNetwork = (networkId = 84532) => {
    let currentNetwork = null;

    switch (networkId) {
        case 1:
            currentNetwork = Network.ETH_MAINNET;
            break;
        case 84532:
            currentNetwork = Network.BASE_SEPOLIA;
            break;
        case 11155111:
            currentNetwork = Network.ETH_SEPOLIA;
            break;
        default:
            currentNetwork = Network.BASE_SEPOLIA;
            break;
    }

    return currentNetwork;
};

export function getAlchemy(networkType = getCurrentNetwork(Environment.NETWORK_ID)) {
    // Optional Config object, but defaults to demo api-key and eth-mainnet.
    let settings = {
        apiKey: Environment.ALCHEMY_KEY, // Replace with your Alchemy API Key.
        network: networkType
    };

    return new Alchemy(settings);
}
