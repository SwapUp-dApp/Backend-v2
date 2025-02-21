import Environment from "../../config";
import { CustomError, handleError } from "../../errors";
import logger from "../../logger";
import { sendTransaction, getContract, ZERO_ADDRESS, prepareContractCall, toWei, readContract } from "thirdweb";
import { currentChain, thirdWebClient } from "../../utils/thirdwebHelpers";
import { SUE_SWAP_CANCEL_ACTION, SUE_SWAP_COMPLETE_ACTION_STRING, SwapMode, SwapModeString } from "../utils/constants";
import { createOrGetSmartAccount, deductSubscriptionTokenCharges, getSubscriptionTokenBalance } from "../utils/helpers";


async function create_swap(req, res) {
  try {
    const { walletId } = req.params;
    const { signerAddress, initiatorAddress, responderAddress, initiatorAssets, responderAssets, signature, userSignMessage, tradeId, swapMode } = req.body;

    const { smartAccount, newSmartWallet } = await createOrGetSmartAccount(walletId);
    const subscriptionToken = await getSubscriptionTokenBalance(smartAccount.address);

    // Get the unique asset types from the initiator assets
    const uniqueAssetTypes = getUniqueAssetTypesCount(initiatorAssets);

    // Check if the user has enough subscription tokens for the number of unique asset types
    if (subscriptionToken.balance < (subscriptionToken.tradeCharges * uniqueAssetTypes)) {
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
    await deductSubscriptionTokenCharges(smartAccount, walletId, subscriptionToken.address, subscriptionToken.tradeCharges);

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

    // Get the unique asset types from the initiator assets
    const uniqueAssetTypes = getUniqueAssetTypesCount(initiatorAssets);

    // Check if the user has enough subscription tokens for the number of unique asset types
    if (subscriptionToken.balance < (subscriptionToken.tradeCharges * uniqueAssetTypes)) {
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
    await deductSubscriptionTokenCharges(smartAccount, walletId, subscriptionToken.address, subscriptionToken.tradeCharges);

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

    // Get the unique asset types from the initiator assets
    const uniqueAssetTypes = getUniqueAssetTypesCount(initiatorAssets);

    // Check if the user has enough subscription tokens for the number of unique asset types
    if (subscriptionToken.balance < (subscriptionToken.tradeCharges * uniqueAssetTypes)) {
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
    await deductSubscriptionTokenCharges(smartAccount, walletId, subscriptionToken.address, subscriptionToken.tradeCharges);

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

    // Get the unique asset types from the initiator assets
    const uniqueAssetTypes = getUniqueAssetTypesCount(responderAssets);

    // Check if the user has enough subscription tokens for the number of unique asset types
    if (subscriptionToken.balance < (subscriptionToken.tradeCharges * uniqueAssetTypes)) {
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
    await deductSubscriptionTokenCharges(smartAccount, walletId, subscriptionToken.address, subscriptionToken.tradeCharges);

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

    // Get the unique asset types from the initiator assets
    const uniqueAssetTypes = getUniqueAssetTypesCount(initiatorAssets);

    // Check if the user has enough subscription tokens for the number of unique asset types
    if (subscriptionToken.balance < (subscriptionToken.tradeCharges * uniqueAssetTypes)) {
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
    await deductSubscriptionTokenCharges(smartAccount, walletId, subscriptionToken.address, subscriptionToken.tradeCharges);

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

const getUniqueAssetTypesCount = (assets) => {
  // Use a Set to store unique asset types
  const uniqueAssetTypes = new Set();

  // Iterate over the assets and add each assetType to the Set
  assets.forEach((asset) => {
    if (asset && asset.assetType) {
      uniqueAssetTypes.add(asset.assetType);
    }
  });

  // Return the size of the Set (number of unique asset types)
  return uniqueAssetTypes.size;
};

export const smartContractController = {
  create_swap,
  complete_swap,
  cancel_swap,
  counter_swap,
  propose_swap,
  get_sign_message_string
};