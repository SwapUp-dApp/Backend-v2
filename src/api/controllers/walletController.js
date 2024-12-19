import { Network, Utils } from "alchemy-sdk";
import db from "../../database/models";
import { getAlchemy } from "../../utils/alchemy";
import Environment from "../../config";
import logger from "../../logger";
import { createOrGetSmartAccount, getSubscriptionTokenBalance } from "../utils/helpers";
import { CustomError, handleError } from "../../errors";
import { privateKeyToAccount, smartWallet } from "thirdweb/wallets";
import { currentChain, thirdWebClient } from "../../utils/thirdwebHelpers";
import { getAvailableTokensList, getTokenSymbolsForWalletBreakdown } from "../../constants/params";
import { getDecryptedPrivateKey, getEncryptedPrivateKey } from "../utils/encryption";


async function token_breakdown_against_wallet(req, res) {
    try {
        const walletId = req.params.walletId;
        let alchemyInstance = getAlchemy();

        const availableTokens = getAvailableTokensList(currentChain.id || Environment.NETWORK_ID);

        // Step 1: Filter ERC20 tokens
        const erc20TokensToFilter = getTokenSymbolsForWalletBreakdown(currentChain.id || Environment.NETWORK_ID);
        const filteredErc20Tokens = availableTokens.filter(token => erc20TokensToFilter.includes(token.id));

        // Step 2: Collect balances for ERC20 tokens
        const erc20TokenBalances = await alchemyInstance.core.getTokenBalances(walletId, filteredErc20Tokens.map(t => t.address));

        // Step 3: Collect balances for Ethereum and other networks
        const networks = [
            { network: Network.ETH_MAINNET, key: 'ETH', name: 'Ethereum' },
            { network: Network.BASE_MAINNET, key: 'base', name: 'Base' },
            { network: Network.BASE_SEPOLIA, key: 'base-sepolia', name: 'Base Sepolia' },
            { network: Network.ETH_SEPOLIA, key: 'eth-sepolia', name: 'Sepolia' }
        ];

        const networkBalances = await Promise.all(networks.map(async ({ network, key, name }) => {
            const balance = await getAlchemy(network).core.getBalance(walletId, 'latest');

            const ethTokenObject = availableTokens.find(token => token.id === key);

            const responseObject = {
                key,
                network: {
                    iconUrl: ethTokenObject.iconUrl,
                    name: name,
                    symbol: ethTokenObject.symbol
                },
                percentage: 0,
                balance: Number(Utils.formatEther(balance))
            };

            return responseObject;
        }));

        // Step 4: Format and combine token balances
        const responseTokenBreakdownList = [...networkBalances];

        if (erc20TokenBalances && erc20TokenBalances.tokenBalances.length > 0) {
            erc20TokenBalances.tokenBalances.forEach(tokenBalanceRes => {
                const matchedErc20Token = filteredErc20Tokens.find(token => token.address === tokenBalanceRes.contractAddress);
                if (matchedErc20Token) {
                    const resObject = {
                        key: matchedErc20Token.id,
                        network: { iconUrl: matchedErc20Token.iconUrl, name: matchedErc20Token.name, symbol: matchedErc20Token.symbol },
                        balance: Number(Utils.formatEther(tokenBalanceRes.tokenBalance))
                    };
                    responseTokenBreakdownList.push(resObject);
                }
            });
        }

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
    get_smart_wallet_details
};