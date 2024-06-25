import { Network, Alchemy } from "alchemy-sdk";

export function getAlchemy() {
    // Optional Config object, but defaults to demo api-key and eth-mainnet.
    const settings = {
        apiKey: process.env.ALCHEMY_KEY, // Replace with your Alchemy API Key.
        network:
            process.env.NETWORK === "1"
                ? Network.ETH_MAINNET
                : Network.BASE_SEPOLIA// Replace with your network.
    };

    return new Alchemy(settings);
}
