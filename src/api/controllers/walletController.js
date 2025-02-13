import { Utils } from "alchemy-sdk";
import db from "../../database/models";
import { getAlchemy } from "../../utils/alchemy";
import Environment from "../../config";
import logger from "../../logger";
import { createOrGetSmartAccount, getSubscriptionTokenBalance } from "../utils/helpers";
import { CustomError, handleError } from "../../errors";
import { privateKeyToAccount, smartWallet } from "thirdweb/wallets";
import { currentChain, thirdWebClient } from "../../utils/thirdwebHelpers";
import { availableNetworks, getAvailableTokensList } from "../../constants/params";
import { getDecryptedPrivateKey, getEncryptedPrivateKey } from "../utils/encryption";


async function token_breakdown_against_wallet(req, res) {
    try {
        const walletId = req.params.walletId;
        let alchemyInstance = getAlchemy();

        const availableTokens = getAvailableTokensList(currentChain.id || Environment.NETWORK_ID);

        // Step 1: Collect balances for ERC20 tokens owned by wallet id
        const erc20TokenBalances = await alchemyInstance.core.getTokenBalances(walletId);

        // Step 2: Collect balances for Ethereum, Base and other networks
        let networks = availableNetworks.filter(network => network.id === currentChain.id);
        if (networks.length === 0) {
            networks = availableNetworks[0];
        }

        const formattedNetworkBalances = await Promise.all(networks.map(async ({ network, key, name }) => {
            const balance = await getAlchemy(network).core.getBalance(walletId, 'latest');
            const ethTokenObject = availableTokens.find(token => token.id === key);
            const responseObject = {
                key,
                network: {
                    iconUrl: ethTokenObject.iconUrl,
                    name: name,
                    symbol: ethTokenObject.symbol,
                    contract: ''
                },
                percentage: 0,
                balance: Number(Utils.formatEther(balance))
            };

            return responseObject;
        }));

        // Step 3: Get ERC20 token metadata owned by the wallet and format it
        let formattedErc20TokenBalances;
        if (erc20TokenBalances && erc20TokenBalances.tokenBalances.length > 0) {
            formattedErc20TokenBalances = await Promise.all(erc20TokenBalances.tokenBalances.map(async (token) => {
                let resObject = {
                    key: '',
                    network: { iconUrl: '', name: '', symbol: '', contract: String(token.contractAddress) },
                    balance: Number(Utils.formatEther(token.tokenBalance)),
                    percentage: 0
                };

                try {
                    const metadata = await alchemyInstance.core.getTokenMetadata(token.contractAddress);

                    if (metadata) {
                        resObject = {
                            ...resObject,
                            key: metadata.symbol,
                            network: {
                                iconUrl: metadata.logo ? metadata.logo : '',
                                name: metadata.name,
                                symbol: metadata.symbol,
                                contract: token.contractAddress
                            }
                        };
                    }

                } catch (error) {
                    logger.error("Error fetching token metadata: ", error);
                    resObject = {
                        ...resObject,
                        key: token.contractAddress,
                        network: {
                            ...resObject.network,
                            contract: token.contractAddress
                        }
                    };
                }

                return resObject;
            }));
        }

        // Step 4: Combine the network balances and ERC20 token balances
        const responseTokenBreakdownList = [...formattedNetworkBalances, ...formattedErc20TokenBalances];

        res.send(responseTokenBreakdownList);
    } catch (err) {
        handleError(res, err, "token_breakdown_against_wallet: error");
    }
}

async function get_subscription_token_balance(req, res) {
    const walletId = req.params.walletId;

    try {
        const { smartAccount, newSmartWallet } = await createOrGetSmartAccount(walletId);
        const balance = await getSubscriptionTokenBalance(smartAccount.address);
        await newSmartWallet.disconnect();
        return res.status(200).json({
            success: true,
            message: "Subscription tokens balance retrieved successfully",
            data: balance,
        });
    } catch (err) {
        handleError(res, err, "get_subscription_token_balance: error");
    }
}

async function test_smart_account_though_private_key(req, res) {
    try {
        const privateKey = req.params.privateKey;

        if (!privateKey) {
            throw new CustomError(401, "Private key is required.");
        }

        // Create a wallet from the private key
        const personalAccount = privateKeyToAccount({
            client: thirdWebClient,
            privateKey
        });

        // Reconnect to the smart wallet (for the treasury smart account)
        const createdSmartWallet = smartWallet({
            chain: currentChain,
            sponsorGas: true,
        });

        // Connect to the smart account
        const smartAccount = await createdSmartWallet.connect({
            client: thirdWebClient,
            personalAccount,
        });

        const response = {
            smartAccount: smartAccount.address,
            chain: currentChain,
        };

        await createdSmartWallet.disconnect();

        return res.status(200).json({
            success: true,
            message: `Smart account: ${response.smartAccount}`,
            transaction: response,
        });
    } catch (err) {
        handleError(res, err, "test_smart_account_though_private_key: error");
    }
}

async function test_encryption_decryption_by_private_key(req, res) {
    try {
        const privateKey = req.params.privateKey;

        if (!privateKey) {
            throw new CustomError(401, "Private key is required.");
        }

        const encryptedPrivateKey = await getEncryptedPrivateKey(privateKey);
        const decryptedPrivateKey = await getDecryptedPrivateKey(encryptedPrivateKey);

        const response = { privateKey, encryptedPrivateKey, decryptedPrivateKey };

        return res.status(200).json({
            success: true,
            message: `Encryption and decryption successful and result is ${privateKey === decryptedPrivateKey}`,
            transaction: response,
        });
    } catch (err) {
        handleError(res, err, "test_encryption_decryption_by_private_key: error");
    }
}

async function get_smart_wallet_details(req, res) {
    try {
        const walletId = req.params.walletId;

        const { smartAccount, newSmartWallet, decryptedPrivateKey } = await createOrGetSmartAccount(walletId);

        const response = {
            address: smartAccount.address,
            decryptedPrivateKey
        };

        await newSmartWallet.disconnect();

        return res.status(200).json({
            success: true,
            message: `Successfully retrieved smart wallet details`,
            transaction: response,
        });
    } catch (err) {
        handleError(res, err, "get_smart_wallet_details: error");
    }
}

async function get_wallet_tokens(req, res) {
    try {
        const walletId = req.params.walletId;
        const alchemyInstance = getAlchemy();

        const erc20TokenBalances = await alchemyInstance.core.getTokenBalances(walletId);

        const responseFormat = await Promise.all(
            erc20TokenBalances.tokenBalances.map(async (token) => {

                const metadata = await alchemyInstance.core.getTokenMetadata(token.contractAddress);

                return ({
                    contract: token.contractAddress,
                    balance: Number(Utils.formatEther(token.tokenBalance)),
                    metadata
                });
            })
        );

        return res.status(200).json({
            success: true,
            message: `Successfully retrieved wallet tokens details`,
            data: responseFormat,
        });
    } catch (err) {
        handleError(res, err, "get_wallet_tokens: error");
    }
}

function test(req, res) {
    let alchemy = getAlchemy();
    logger.info(alchemy);
    res.send({ network: Environment.NETWORK_ID });
}



export const walletController = {
    token_breakdown_against_wallet,
    get_subscription_token_balance,
    test,
    test_smart_account_though_private_key,
    test_encryption_decryption_by_private_key,
    get_smart_wallet_details,
    get_wallet_tokens
};