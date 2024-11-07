import { createThirdwebClient } from "thirdweb";
import { baseSepolia, sepolia, ethereum } from "thirdweb/chains";
import Environment from "../config";


const swapupAvailbleChains = [
  baseSepolia,
  sepolia,
  ethereum
];

const clientId = Environment.THIRDWEB_CLIENT_ID;
const chainByEnvirnment = swapupAvailbleChains.find(chain => chain.id === Number(Environment.CHAIN_ID));

export const thirdWebClient = createThirdwebClient({ clientId });
export const currentChain = chainByEnvirnment ? chainByEnvirnment : baseSepolia;
