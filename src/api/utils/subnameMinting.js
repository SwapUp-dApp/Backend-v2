import { ethereum, sepolia } from "thirdweb/chains";
import { currentChain, thirdWebClient } from "../../utils/thirdwebHelpers";
import logger from "../../logger";
import { getTreasurySmartAccount } from "./treasury";
import { createNamespaceClient } from "namespace-sdk";
import Environment from "../../config";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import db from "../../database/models";
import { CustomError } from "../../errors";
import { SUE_PaymentMode } from "./constants";
import { createOrGetSmartAccount, deductSubscriptionTokenCharges, getSubscriptionTokenBalance } from "./helpers";

const computedChain = currentChain.testnet ? sepolia : ethereum;
const LISTED_NAME = Environment.NAMESPACE_LISTED_ENS_NAME;

const handleSubnameSubscriptionTokens = async (minterEOA, mode = "BALANCE_CHECK") => {
  const { smartAccount, newSmartWallet } = await createOrGetSmartAccount(minterEOA);

  const subscriptionToken = await getSubscriptionTokenBalance(smartAccount.address);

  if (mode === "BALANCE_CHECK") {
    if (subscriptionToken.balance < subscriptionToken.subnameCharges) {
      throw new CustomError(400, "Insufficient Subscription Token Balance To Mint Subname");
    }
  }

  if (mode === "TOKEN_DEDUCTION") {
    await deductSubscriptionTokenCharges(smartAccount, minterEOA, subscriptionToken.address, subscriptionToken.subnameCharges, "Subname");
  }

  await newSmartWallet.disconnect();
};

export const getNamespaceClientAndListing = async (listedName = LISTED_NAME) => {
  // console.log("Listed name: ", LISTED_NAME);
  const NamespaceClient = createNamespaceClient({
    chainId: currentChain.id,
    mintSource: `swapup`,
    rpcUrl: currentChain.rpc
  });

  // console.log("NamespaceClient: ", NamespaceClient);
  const listing = await NamespaceClient.getListedName(listedName, computedChain.id);
  return { NamespaceClient, listing };
};

export const handleCheckSubnameAvailability = async (subnameLabel, listedName = LISTED_NAME) => {
  const { NamespaceClient, listing } = await getNamespaceClientAndListing(listedName);
  const isAvailable = await NamespaceClient.isSubnameAvailable(listing, subnameLabel);
  return isAvailable;
};

export const handleGetMintSubnameTransactionParams = async (subnameLabel, minterAddress, treasuryAddress) => {
  // Check if the subname is available or not
  const isAvailable = await handleCheckSubnameAvailability(subnameLabel);
  if (!isAvailable) {
    throw new CustomError(400, "Subname is already taken.");
  }

  const { NamespaceClient, listing } = await getNamespaceClientAndListing();

  const foundToken = await db.subnameAccess.findOne({
    where: { address: Environment.SUBNAME_ACCESS_WALLET, listedName: Environment.NAMESPACE_LISTED_ENS_NAME, chainId: currentChain.id || Environment.NETWORK_ID },
    attributes: ["accessToken", "refreshToken"],
    raw: true
  });

  if (!foundToken || !foundToken.accessToken || !foundToken.refreshToken) {
    throw new CustomError(404, `Subname access token not found for: ${Environment.SUBNAME_ACCESS_WALLET}, Chain ID: ${currentChain.id} and listed name: ${Environment.NAMESPACE_LISTED_ENS_NAME}`);
  }

  const transactionParams = await NamespaceClient.getMintTransactionParameters(listing, {
    minterAddress: treasuryAddress,
    subnameLabel: subnameLabel,
    subnameOwner: minterAddress,
    token: foundToken.refreshToken
  });

  if (transactionParams) { console.log("Generated transaction params: ", transactionParams); }

  return transactionParams;
};

export const handleMintNewSubname = async (subnameLabel, minterAddress, paymentMode) => {

  if (paymentMode === SUE_PaymentMode.SUBSCRIPTION_TOKENS) {
    await handleSubnameSubscriptionTokens(minterAddress, "BALANCE_CHECK");
  }

  const { smartAccount, createdSmartWallet } = await getTreasurySmartAccount();
  const treasuryAddress = smartAccount.address;

  const transactionParams = await handleGetMintSubnameTransactionParams(subnameLabel, minterAddress, treasuryAddress);
  // const transactionParams = await handleGetMintSubnameTransactionParams("treasury", smartAccount.address); // for minting subname for teasury

  const namespaceContract = getContract({
    address: transactionParams.contractAddress,
    client: thirdWebClient,
    chain: currentChain,
    abi: transactionParams.abi
  });

  // This method is used for minting subname on Sepolia ETH & Ethereum mainnet (L1)
  // method: "function mint((bytes32 parentNode, string subnameLabel, address resolver, address subnameOwner, uint32 fuses, uint256 mintPrice, uint256 mintFee, uint64 ttl, uint64 expiry) context, bytes signature) external payable",

  const preparedTransaction = prepareContractCall({
    contract: namespaceContract,
    method: "function mint((address owner, string label, bytes32 parentNode, uint256 price, uint256 fee, address paymentReceiver, uint256 expiry, uint256 signatureExpiry, address verifiedMinter), bytes signature, bytes[] resolverData, bytes extraData) external payable",
    params: transactionParams.args,
    value: transactionParams.value
  });


  const transactionRes = await sendTransaction({
    transaction: preparedTransaction,
    account: smartAccount
  });

  // Deduct tokens from users smart wallet
  if (paymentMode === SUE_PaymentMode.SUBSCRIPTION_TOKENS) {
    await handleSubnameSubscriptionTokens(minterAddress, "TOKEN_DEDUCTION");
  }

  // Disconnect the smart account
  await createdSmartWallet.disconnect();

  return transactionRes;
};