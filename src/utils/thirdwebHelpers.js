import { createThirdwebClient } from "thirdweb";
import { baseSepolia, sepolia, ethereum, base } from "thirdweb/chains";
import Environment from "../config";


const swapupAvailbleChains = [
  baseSepolia,
  base,
  sepolia,
  ethereum
];

const clientId = Environment.THIRDWEB_CLIENT_ID;
const chainByEnvirnment = swapupAvailbleChains.find(chain => chain.id === Number(Environment.NETWORK_ID));

export const thirdWebClient = createThirdwebClient({ clientId });
export const currentChain = chainByEnvirnment ? chainByEnvirnment : baseSepolia;
