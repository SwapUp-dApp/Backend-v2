import Environment from "../../config";
import { CustomError, handleError } from "../../errors";
import logger from "../../logger";

import { ethers6Adapter } from "thirdweb/adapters/ethers6";
import { smartWallet, privateKeyToAccount } from "thirdweb/wallets";
import { sendTransaction, getContract, ZERO_ADDRESS, prepareContractCall, toWei, readContract } from "thirdweb";
import { currentChain, thirdWebClient } from "../../utils/thirdwebHelpers";
import { SUE_SWAP_CANCEL_ACTION, SUE_SWAP_COMPLETE_ACTION_STRING, SwapMode, SwapModeString } from "../utils/constants";
import db from "../../database/models";
// import { useReadContract } from "thirdweb/react";


// To transfer ERC20 Tokens from swapup treasury smart account --> users smart account
async function create_swap(req, res) {
  try {
    const { walletId } = req.params;
    const { signerAddress, initiatorAddress, responderAddress, initiatorAssets, responderAssets, signature, userSignMessage, tradeId, swapMode } = req.body;

    const { smartAccount, newSmartWallet } = await createOrGetSmartAccount(walletId);

    const swapupContract = getContract({
      address: Environment.SWAPUP_CONTRACT,
      client: thirdWebClient,
      chain: currentChain,
    });

    const { formattedInitAssets, formattedAcceptAssets } = await getFormattedAssetsBySwap(smartAccount, initiatorAssets, responderAssets);

    // logger.info("UnFormatted init assets: ", initiatorAssets);
    // logger.info("UnFormatted accept assets: ", responderAssets);

    // console.log("Formatted init assets: ", formattedInitAssets);
    // console.log("Formatted accept assets: ", formattedAcceptAssets);

    const preparedTransaction = prepareContractCall({
      contract: swapupContract,
      method: "function createSwap(address signerAddress, address initiatorAddress, address responderAddress, (address,uint256,string)[] initiatorAssets, (address,uint256,string)[] responderAssets,bytes signature, string signerStartingMessage, string swapId, string swapType)",
      params: [
        signerAddress,
        initiatorAddress,
        swapMode === SwapMode.OPEN ? ZERO_ADDRESS : responderAddress,
        formattedInitAssets,
        formattedAcceptAssets,
        signature,
        userSignMessage,
        tradeId,
        SwapModeString[`value${swapMode}`]
      ],
    });

    const transactionRes = await sendTransaction({
      transaction: preparedTransaction,
      account: smartAccount
    });

    // Log the transaction and respond with success
    logger.info(`Swap create response:`, transactionRes);

    await newSmartWallet.disconnect();

    return res.status(201).json({
      success: true,
      message: `Successfully created swap`,
      transaction: transactionRes,
    });
  } catch (err) {
    handleError(res, err, "create_swap: error");
  }
}

async function counter_swap(req, res) {
  try {
    const { walletId } = req.params;
    const { signerAddress, initiatorAddress, responderAddress, initiatorAssets, responderAssets, signature, userSignMessage, tradeId, swapMode } = req.body;

    const { smartAccount, newSmartWallet } = await createOrGetSmartAccount(walletId);

    const swapupContract = getContract({
      address: Environment.SWAPUP_CONTRACT,
      client: thirdWebClient,
      chain: currentChain,
    });

    const { formattedInitAssets, formattedAcceptAssets } = await getFormattedAssetsBySwap(smartAccount, initiatorAssets, responderAssets);

    const preparedTransaction = prepareContractCall({
      contract: swapupContract,
      method: "function counterSwap(address signerAddress, address initiatorAddress, address responderAddress, (address,uint256,string)[] initiatorAssets, (address,uint256,string)[] responderAssets,bytes signature, string signerStartingMessage, string swapId, string swapType)",
      params: [
        signerAddress,
        initiatorAddress,
        responderAddress,
        formattedInitAssets,
        formattedAcceptAssets,
        signature,
        userSignMessage,
        tradeId,
        SwapModeString[`value${swapMode}`]
      ],
    });

    const transactionRes = await sendTransaction({
      transaction: preparedTransaction,
      account: smartAccount
    });

    // Log the transaction and respond with success
    logger.info(`Counter swap response:`, transactionRes);

    await newSmartWallet.disconnect();

    return res.status(201).json({
      success: true,
      message: `Created counter swap successfully!`,
      transaction: transactionRes,
    });
  } catch (err) {
    handleError(res, err, "counter_swap: error");
  }
}

async function propose_swap(req, res) {
  try {
    const { walletId } = req.params;
    const { signerAddress, initiatorAddress, responderAddress, initiatorAssets, responderAssets, signature, userSignMessage, tradeId, openTradeId } = req.body;

    const { smartAccount, newSmartWallet } = await createOrGetSmartAccount(walletId);

    const swapupContract = getContract({
      address: Environment.SWAPUP_CONTRACT,
      client: thirdWebClient,
      chain: currentChain,
    });

    const { formattedInitAssets, formattedAcceptAssets } = await getFormattedAssetsBySwap(smartAccount, initiatorAssets, responderAssets);

    const preparedTransaction = prepareContractCall({
      contract: swapupContract,
      method: "function proposeToOpenSwap(address signerAddress, address initiatorAddress, address responderAddress, (address,uint256,string)[] initiatorAssets, (address,uint256,string)[] responderAssets,bytes signature, string signerStartingMessage, string openSwapId, string proposalId)",
      params: [
        signerAddress,
        initiatorAddress,
        responderAddress,
        formattedInitAssets,
        formattedAcceptAssets,
        signature,
        userSignMessage,
        openTradeId,
        tradeId
      ],
    });

    const transactionRes = await sendTransaction({
      transaction: preparedTransaction,
      account: smartAccount
    });

    // Log the transaction and respond with success
    logger.info(`Propose swap response:`, transactionRes);

    await newSmartWallet.disconnect();

    return res.status(201).json({
      success: true,
      message: `Successfully created swap`,
      transaction: transactionRes,
    });
  } catch (err) {
    handleError(res, err, "propose_swap: error");
  }
}

async function complete_swap(req, res) {
  try {
    const { walletId } = req.params;
    const { signerAddress, initiatorAddress, responderAddress, initiatorAssets, responderAssets, signature, userSignMessage, tradeId, swapAction, swapMode } = req.body;

    const { smartAccount, newSmartWallet } = await createOrGetSmartAccount(walletId);

    const swapupContract = getContract({
      address: Environment.SWAPUP_CONTRACT,
      client: thirdWebClient,
      chain: currentChain,
    });

    const { formattedInitAssets, formattedAcceptAssets } = await getFormattedAssetsBySwap(smartAccount, initiatorAssets, responderAssets);

    const preparedTransaction = prepareContractCall({
      contract: swapupContract,
      method: "function completeSwap(address signerAddress, address initiatorAddress, address responderAddress, (address,uint256,string)[] initiatorAssets, (address,uint256,string)[] responderAssets, bytes signature, string signerStartingMessage, string tradeId, string swapStatus, string swapType)",
      params: [
        signerAddress,
        initiatorAddress,
        responderAddress,
        formattedInitAssets,
        formattedAcceptAssets,
        signature,
        userSignMessage,
        tradeId,
        SUE_SWAP_COMPLETE_ACTION_STRING[`value${swapAction}`],
        SwapModeString[`value${swapMode}`]
      ],
    });

    const transactionRes = await sendTransaction({
      transaction: preparedTransaction,
      account: smartAccount
    });

    // Log the transaction and respond with success
    logger.info(`Swap complete response:`, transactionRes);
    await newSmartWallet.disconnect();

    return res.status(201).json({
      success: true,
      message: `Swap completed successfully.`,
      transaction: transactionRes,
    });
  } catch (err) {
    handleError(res, err, "complete_swap: error");
  }
}

async function cancel_swap(req, res) {
  try {
    const { walletId } = req.params;
    const { signerAddress, initiatorAddress, responderAddress, initiatorAssets, responderAssets, signature, userSignMessage, tradeId, openTradeId, swapMode } = req.body;

    const { smartAccount, newSmartWallet } = await createOrGetSmartAccount(walletId);

    const swapupContract = getContract({
      address: Environment.SWAPUP_CONTRACT,
      client: thirdWebClient,
      chain: currentChain,
    });

    const { formattedInitAssets, formattedAcceptAssets } = await getFormattedAssetsBySwap(smartAccount, initiatorAssets, responderAssets);

    let cancelType, swapId, receiverAddress;

    if (openTradeId) {
      cancelType = SUE_SWAP_CANCEL_ACTION.SWAP;
      swapId = openTradeId;
      receiverAddress = ZERO_ADDRESS;
    } else if (swapMode === SwapMode.OPEN) {
      cancelType = SUE_SWAP_CANCEL_ACTION.PROPOSAL;
      swapId = tradeId;
      receiverAddress = responderAddress;
    } else if (swapMode === SwapMode.PRIVATE) {
      cancelType = SUE_SWAP_CANCEL_ACTION.SWAP;
      swapId = tradeId;
      receiverAddress = responderAddress;
    } else {
      throw new CustomError(500, "Cannot have both tradeId and openTradeId at the same time.");
    }

    const preparedTransaction = prepareContractCall({
      contract: swapupContract,
      method: "function cancelSwap(address signerAddress, address initiatorAddress, address responderAddress, (address,uint256,string)[] initiatorAssets, (address,uint256,string)[] responderAssets, bytes signature, string signerStartingMessage, string swapId, string cancelType)",
      params: [
        signerAddress,
        initiatorAddress,
        receiverAddress,
        formattedInitAssets,
        formattedAcceptAssets,
        signature,
        userSignMessage,
        swapId,
        cancelType
      ],
    });

    const transactionRes = await sendTransaction({
      transaction: preparedTransaction,
      account: smartAccount
    });

    // Log the transaction and respond with success
    logger.info(`Cancel swap response:`, transactionRes);
    await newSmartWallet.disconnect();

    return res.status(201).json({
      success: true,
      message: `Swap canceled successfully.`,
      transaction: transactionRes,
    });
  } catch (err) {
    handleError(res, err, "cancel_swap: error");
  }
}

async function get_sign_message_string(req, res) {
  try {
    const { walletId } = req.params;
    const { signerAddress, initiatorAddress, responderAddress, initiatorAssets, responderAssets, signature, userSignMessage } = req.body;

    const { smartAccount, newSmartWallet } = await createOrGetSmartAccount(walletId);

    const swapupContract = getContract({
      address: Environment.SWAPUP_CONTRACT,
      client: thirdWebClient,
      chain: currentChain
    });

    const { formattedInitAssets, formattedAcceptAssets } = await getFormattedAssetsBySwap(smartAccount, initiatorAssets, responderAssets);

    const result = await readContract({
      contract: swapupContract,
      method: "function getSignString(address signerAddress, address initiatorAddress, address responderAddress, (address,uint256,string)[] initiatorAssets, (address,uint256,string)[] responderAssets, bytes signature, string signerStartingMessage) pure returns (string memory)",
      params: [
        signerAddress,
        initiatorAddress,
        responderAddress,
        formattedInitAssets,
        formattedAcceptAssets,
        signature,
        userSignMessage
      ]
    });

    // Log the transaction and respond with success
    logger.info(`Swap complete response:`, result);
    await newSmartWallet.disconnect();

    return res.status(201).json({
      success: true,
      message: `Sign message received.`,
      transaction: result,
    });
  } catch (err) {
    handleError(res, err, "get_sign_message_string: error");
  }
}


// Helper functions
async function createOrGetSmartAccount(walletId) {
  // Find the user based on the wallet ID
  const user = await db.users.findOne({
    where: { wallet: walletId }
  });

  if (!user) {
    throw new Error(`User with wallet ID ${walletId} not found.`);
  }

  let personalAccount, newSmartWallet, smartAccount;

  // Check if the smart account already exists in the user's data
  if (user.smartAccount && user.privateKey) {
    // Create personal account with the existing private key
    personalAccount = privateKeyToAccount({
      client: thirdWebClient,
      privateKey: user.privateKey,
    });

    // Create a new smart wallet
    newSmartWallet = smartWallet({
      chain: currentChain,
      sponsorGas: true,
    });

    // Connect to the existing smart account
    smartAccount = await newSmartWallet.connect({
      client: thirdWebClient,
      personalAccount,
    });

    return { smartAccount, newSmartWallet }; // Return the connected smart account
  }

  // If no smart account exists, create a new one
  const generatedPrivateKey = Wallet.createRandom().privateKey;
  personalAccount = privateKeyToAccount({
    client: thirdWebClient,
    privateKey: generatedPrivateKey,
  });

  // Configure the new smart wallet
  newSmartWallet = smartWallet({
    chain: currentChain,
    sponsorGas: true,
  });

  // Connect to the new smart account
  smartAccount = await newSmartWallet.connect({
    client: thirdWebClient,
    personalAccount,
  });

  // Save the new smart account and private key to the user's record
  if (smartAccount.address && generatedPrivateKey) {
    await user.update({
      privateKey: generatedPrivateKey,
      smartAccount: smartAccount.address,
    });
  }

  // Define admin addresses to be added
  const adminAddresses = [walletId, Environment.SWAPUP_TREASURY_SMART_ACCOUNT]; // User's walletId and Swapup treasury wallet

  // Adding admins to the smart wallet
  try {
    const addAdminToSmartWallet = async (adminAddress) => {
      const adminTransaction = addAdmin({
        contract: getContract({
          address: smartAccount.address,
          client: thirdWebClient,
          chain: currentChain,
        }),
        account: smartAccount,
        adminAddress,
      });

      // logger.info(`Adding admin: ${adminAddress}`, adminTransaction);

      return await sendTransaction({
        transaction: adminTransaction,
        account: smartAccount,
      });
    };

    // Add admin accounts
    if (walletId === Environment.SWAPUP_TREASURY_SMART_ACCOUNT) {
      const result = await addAdminToSmartWallet(walletId);
      logger.info(`Admin ${walletId} added: `, result);
    } else {
      for (const adminAddress of adminAddresses) {
        const result = await addAdminToSmartWallet(adminAddress);
        logger.info(`Admin ${adminAddress} added: `, result);
      }
    }
  } catch (error) {
    logger.error(`Admin not added: ${error.message || error}`);
  }

  return { smartAccount, newSmartWallet }; // Return the newly connected smart account
}

const getFormattedAssetsBySwap = async (smartAccount, initiatorAssets, responderAssets) => {
  try {
    let formattedInitAssets = [];
    let formattedAcceptAssets = [];


    for (const token of initiatorAssets) {
      const newInitToken = [
        String(token.assetAddress),
        token.assetType === "ERC20" ? toWei(token.amountOrID) : Number(token.amountOrID),
        String(token.assetType)
      ];
      formattedInitAssets.push(newInitToken);
    }

    for (const token of responderAssets) {
      const newAcceptToken = [
        String(token.assetAddress),
        token.assetType === "ERC20" ? toWei(token.amountOrID) : Number(token.amountOrID),
        String(token.assetType)
      ];
      formattedAcceptAssets.push(newAcceptToken);
    }

    return { formattedInitAssets, formattedAcceptAssets };
  } catch (err) {
    throw err;
  }

};

export const smartContractController = {
  create_swap,
  complete_swap,
  cancel_swap,
  counter_swap,
  propose_swap,
  get_sign_message_string
};