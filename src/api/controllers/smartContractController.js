import Environment from "../../config";
import { CustomError, handleError } from "../../errors";
import logger from "../../logger";

import { ethers6Adapter } from "thirdweb/adapters/ethers6";
import { smartWallet, privateKeyToAccount } from "thirdweb/wallets";
import { sendTransaction, getContract, ZERO_ADDRESS, prepareContractCall } from "thirdweb";
import { currentChain, thirdWebClient } from "../../utils/thirdwebHelpers";
import { SUE_SWAP_COMPLETE_ACTION_STRING, SwapMode, SwapModeString } from "../utils/constants";
import db from "../../database/models";
import { abi } from "../../constants/abi";
import { ethers } from "ethers";


// To transfer ERC20 Tokens from swapup treasury smart account --> users smart account
async function create_swap(req, res) {
  try {
    const { walletId } = req.params;
    const { signerAddress, initiatorAddress, responderAddress, initiatorAssets, responderAssets, signature, userSignMessage, tradeId, swapMode } = req.body;

    const smartAccount = await createOrGetSmartAccount(walletId);

    const swapupContract = getContract({
      address: Environment.SWAPUP_CONTRACT,
      client: thirdWebClient,
      chain: currentChain,
    });

    const formattedInitAssets = initiatorAssets.map(asset => [
      asset.assetAddress,
      BigInt(asset.amountOrID),
      asset.assetType,
    ]);

    const formattedAcceptAssets = responderAssets.map(asset => [
      asset.assetAddress,
      BigInt(asset.amountOrID),
      asset.assetType,
    ]);

    // const { formattedInitAssets, formattedAcceptAssets } = await getFormattedAssetsBySwap(smartAccount, initiatorAssets, responderAssets);

    logger.info("UnFormatted init assets: ", initiatorAssets);
    logger.info("UnFormatted accept assets: ", responderAssets);

    logger.info("Formatted init assets: ", formattedInitAssets);
    logger.info("Formatted accept assets: ", formattedAcceptAssets);

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
    return res.status(201).json({
      success: true,
      message: `Successfully created swap`,
      transaction: transactionRes,
    });
  } catch (err) {
    handleError(res, err, "create_swap: error");
  }
}

async function complete_swap(req, res) {
  try {
    const { walletId } = req.params;
    const { signerAddress, initiatorAddress, responderAddress, initiatorAssets, responderAssets, signature, userSignMessage, tradeId, swapAction, swapMode } = req.body;

    const smartAccount = await createOrGetSmartAccount(walletId);

    const swapupContract = getContract({
      address: Environment.SWAPUP_CONTRACT,
      client: thirdWebClient,
      chain: currentChain,
    });

    const formattedInitAssets = initiatorAssets.map(asset => [
      asset.assetAddress,
      BigInt(asset.amountOrID),
      asset.assetType,
    ]);

    const formattedAcceptAssets = responderAssets.map(asset => [
      asset.assetAddress,
      BigInt(asset.amountOrID),
      asset.assetType,
    ]);



    const preparedTransaction = prepareContractCall({
      contract: swapupContract,
      method: "function completeSwap(address signerAddress, address initiatorAddress, address responderAddress, (address,uint256,string)[] initiatorAssets, (address,uint256,string)[] responderAssets, bytes signature, string signerStartingMessage, string tradeId, string swapStatus, string swapType)",
      params: [
        signerAddress,
        initiatorAddress,
        swapMode === SwapMode.OPEN ? ZERO_ADDRESS : responderAddress,
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
    return res.status(201).json({
      success: true,
      message: `Swap completed successfully.`,
      transaction: transactionRes,
    });
  } catch (err) {
    handleError(res, err, "complete_swap: error");
  }
}

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

    return smartAccount; // Return the connected smart account
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

  return smartAccount; // Return the newly connected smart account
}


// const getAmountInWeiForErc20Token = async (smartAccount, swapAsset) => {
//   const { signer } = await getEthersProviderAndSigner(smartAccount);
//   const contract = new ethers.Contract(
//     swapAsset.assetAddress,
//     abi.erc20,
//     signer
//   );

//   const decimals = await contract.decimals();
//   const amountInWei = await ethers.parseUnits(String(swapAsset.amountOrID), decimals);
//   return amountInWei;
// };

// const getEthersProviderAndSigner = async (smartAccount) => {
//   // convert a thirdweb account to ethers signer
//   let provider = await ethers6Adapter.provider.toEthers({ client: thirdWebClient, chain: currentChain });
//   let signer = await ethers6Adapter.signer.toEthers({
//     client: thirdWebClient,
//     chain: currentChain,
//     account: smartAccount
//   });
//   return { provider, signer };
// };

// const getFormattedAssetsBySwap = async (smartAccount, initiatorAssets, responderAssets) => {
//   try {
//     let formattedInitAssets = [];
//     let formattedAcceptAssets = [];


//     for (const token of initiatorAssets) {
//       const newInitToken = [
//         token.assetAddress,
//         token.assetType === "ERC20" ? await getAmountInWeiForErc20Token(smartAccount, token) : BigInt(token.amountOrID),
//         token.assetType
//       ];
//       formattedInitAssets.push(newInitToken);
//     }

//     for (const token of responderAssets) {
//       const newAcceptToken = [
//         token.assetAddress,
//         token.assetType === "ERC20" ? await getAmountInWeiForErc20Token(smartAccount, token) : BigInt(token.amountOrID),
//         token.assetType
//       ];
//       formattedAcceptAssets.push(newAcceptToken);
//     }

//     return { formattedInitAssets, formattedAcceptAssets };
//   } catch (err) {
//     throw err;
//   }

// };

export const smartContractController = {
  create_swap,
  complete_swap
};