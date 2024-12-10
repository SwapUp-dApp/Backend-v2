import Environment from "../../config";
import { CustomError, handleError } from "../../errors";
import logger from "../../logger";
import { sendTransaction, getContract, ZERO_ADDRESS, prepareContractCall, toWei, readContract } from "thirdweb";
import { currentChain, thirdWebClient } from "../../utils/thirdwebHelpers";
import { SUE_SWAP_CANCEL_ACTION, SUE_SWAP_COMPLETE_ACTION_STRING, SwapMode, SwapModeString } from "../utils/constants";
import db from "../../database/models";
import { createOrGetSmartAccount, getSubscriptionTokenBalance } from "../utils/helpers";
import { transfer } from "thirdweb/extensions/erc20";


async function create_swap(req, res) {
  try {
    const { walletId } = req.params;
    const { signerAddress, initiatorAddress, responderAddress, initiatorAssets, responderAssets, signature, userSignMessage, tradeId, swapMode } = req.body;

    const { smartAccount, newSmartWallet } = await createOrGetSmartAccount(walletId);
    const subscriptionToken = await getSubscriptionTokenBalance(smartAccount.address);

    if (subscriptionToken.balance < subscriptionToken.tradeCharges) {
      throw new CustomError(400, "Insufficient Subscription Token Balance");
    }

    const swapupContract = getContract({
      address: Environment.SWAPUP_CONTRACT,
      client: thirdWebClient,
      chain: currentChain,
    });

    const { formattedInitAssets, formattedAcceptAssets } = await getFormattedAssetsBySwap(initiatorAssets, responderAssets);

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
    // Deducting the trade token charges - transferring back to treasury smart wallet
    await deductTradeTokenCharges(smartAccount, walletId, subscriptionToken.address, subscriptionToken.tradeCharges);

    await newSmartWallet.disconnect();

    return res.status(201).json({
      success: true,
      message: `Successfully created swap`,
      transaction: { ...transactionRes, TokenCharged: subscriptionToken.tradeCharges },
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

    const subscriptionToken = await getSubscriptionTokenBalance(smartAccount.address);
    if (subscriptionToken.balance < subscriptionToken.tradeCharges) {
      throw new CustomError(400, "Insufficient Subscription Token Balance");
    }

    const swapupContract = getContract({
      address: Environment.SWAPUP_CONTRACT,
      client: thirdWebClient,
      chain: currentChain,
    });

    const { formattedInitAssets, formattedAcceptAssets } = await getFormattedAssetsBySwap(initiatorAssets, responderAssets);

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

    // Deducting the trade token charges - transferring back to treasury smart wallet
    await deductTradeTokenCharges(smartAccount, walletId, subscriptionToken.address, subscriptionToken.tradeCharges);

    await newSmartWallet.disconnect();

    return res.status(201).json({
      success: true,
      message: `Created counter swap successfully!`,
      transaction: { ...transactionRes, TokenCharged: subscriptionToken.tradeCharges },
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

    const subscriptionToken = await getSubscriptionTokenBalance(smartAccount.address);
    if (subscriptionToken.balance < subscriptionToken.tradeCharges) {
      throw new CustomError(400, "Insufficient Subscription Token Balance");
    }

    const swapupContract = getContract({
      address: Environment.SWAPUP_CONTRACT,
      client: thirdWebClient,
      chain: currentChain,
    });

    const { formattedInitAssets, formattedAcceptAssets } = await getFormattedAssetsBySwap(initiatorAssets, responderAssets);

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

    // Deducting the trade token charges - transferring back to treasury smart wallet
    await deductTradeTokenCharges(smartAccount, walletId, subscriptionToken.address, subscriptionToken.tradeCharges);

    await newSmartWallet.disconnect();

    return res.status(201).json({
      success: true,
      message: `Successfully created swap`,
      transaction: { ...transactionRes, TokenCharged: subscriptionToken.tradeCharges },
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

    const subscriptionToken = await getSubscriptionTokenBalance(smartAccount.address);
    if (subscriptionToken.balance < subscriptionToken.tradeCharges) {
      throw new CustomError(400, "Insufficient Subscription Token Balance");
    }

    const swapupContract = getContract({
      address: Environment.SWAPUP_CONTRACT,
      client: thirdWebClient,
      chain: currentChain,
    });

    const { formattedInitAssets, formattedAcceptAssets } = await getFormattedAssetsBySwap(initiatorAssets, responderAssets);

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

    // Deducting the trade token charges - transferring back to treasury smart wallet
    await deductTradeTokenCharges(smartAccount, walletId, subscriptionToken.address, subscriptionToken.tradeCharges);

    await newSmartWallet.disconnect();

    return res.status(201).json({
      success: true,
      message: `Swap completed successfully.`,
      transaction: { ...transactionRes, TokenCharged: subscriptionToken.tradeCharges },
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

    const subscriptionToken = await getSubscriptionTokenBalance(smartAccount.address);
    if (subscriptionToken.balance < subscriptionToken.tradeCharges) {
      throw new CustomError(400, "Insufficient Subscription Token Balance");
    }

    const swapupContract = getContract({
      address: Environment.SWAPUP_CONTRACT,
      client: thirdWebClient,
      chain: currentChain,
    });

    const { formattedInitAssets, formattedAcceptAssets } = await getFormattedAssetsBySwap(initiatorAssets, responderAssets);

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

    // Deducting the trade token charges - transferring back to treasury smart wallet
    await deductTradeTokenCharges(smartAccount, walletId, subscriptionToken.address, subscriptionToken.tradeCharges);

    await newSmartWallet.disconnect();

    return res.status(201).json({
      success: true,
      message: `Swap canceled successfully.`,
      transaction: { ...transactionRes, TokenCharged: subscriptionToken.tradeCharges },
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

    const { formattedInitAssets, formattedAcceptAssets } = await getFormattedAssetsBySwap(initiatorAssets, responderAssets);

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
const getFormattedAssetsBySwap = async (initiatorAssets, responderAssets) => {
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

const deductTradeTokenCharges = async (userSmartAccount, ownerWalletId, tokenAddress, amount) => {
  // Retrieve the ERC-20 token contract
  const tokenContract = getContract({
    address: tokenAddress,
    client: thirdWebClient,
    chain: currentChain,
  });

  // Check if the token contract was initialized correctly
  if (!tokenContract) {
    throw new Error("Token contract could not be initialized.");
  }

  // Call the extension function to prepare the transaction
  const transaction = transfer({
    contract: tokenContract,
    to: Environment.SWAPUP_TREASURY_SMART_ACCOUNT,
    amount: amount,
  });

  // Send the transfer transaction from the smart account
  const transferResult = await sendTransaction({
    transaction,
    account: userSmartAccount,
  });

  // Log the transaction and respond with success
  logger.info(`Trade tokens charges deducted from ${userSmartAccount.address} owned by ${ownerWalletId}`, transferResult);
};

export const smartContractController = {
  create_swap,
  complete_swap,
  cancel_swap,
  counter_swap,
  propose_swap,
  get_sign_message_string
};