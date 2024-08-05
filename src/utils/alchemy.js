import { Network, Alchemy } from "alchemy-sdk";

const currentNetwork = process.env.NETWORK === "1" ? Network.ETH_MAINNET : Network.ETH_SEPOLIA;

export function getAlchemy(networkType = currentNetwork) {
    // Optional Config object, but defaults to demo api-key and eth-mainnet.
    let settings = {
        apiKey: process.env.ALCHEMY_KEY, // Replace with your Alchemy API Key.
        network: networkType
    };

    return new Alchemy(settings);
}
