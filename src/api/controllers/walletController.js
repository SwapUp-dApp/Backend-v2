import { Network, Utils } from "alchemy-sdk";
import db from "../../database/models";
import { getAlchemy } from "../../utils/alchemy";
import Environment from "../../config";
import logger from "../../logger";

const availableTokens = [
    {
        "id": "ETH",
        "symbol": "ETH",
        "name": "Ethereum",
        "iconUrl": "https://cdn.coinranking.com/rk4RKHOuW/eth.svg",
        "address": ""
    },
    {
        "id": "base",
        "symbol": "ETH",
        "name": "Base",
        "iconUrl": "/assets/svgs/base.svg",
        "address": ""
    },
    {
        "id": "base-sepolia",
        "symbol": "ETH",
        "name": "Base sepolia",
        "iconUrl": "/assets/svgs/base-sepolia.svg",
        "address": ""
    },
    {
        "id": "eth-sepolia",
        "symbol": "ETH",
        "name": "Sepolia",
        "iconUrl": "https://metaschool.so/_next/static/media/unknown-logo.7eda54b1.webp",
        "address": ""
    },
    {
        "id": "USDT",
        "symbol": "USDT",
        "name": "Tether USD",
        "iconUrl": "https://cdn.coinranking.com/mgHqwlCLj/usdt.svg",
        "address": "0xdac17f958d2ee523a2206206994597c13d831ec7"
    },
    {
        "id": "BNB",
        "symbol": "BNB",
        "name": "BNB",
        "iconUrl": "https://cdn.coinranking.com/B1N19L_dZ/bnb.svg",
        "address": "0xb8c77482e45f1f44de1745f52c74426c631bdd52"
    },
    {
        "id": "USDC",
        "symbol": "USDC",
        "name": "USDC",
        "iconUrl": "https://cdn.coinranking.com/jkDf8sQbY/usdc.svg",
        "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
    },
    {
        "id": "stETH",
        "symbol": "stETH",
        "name": "Lido Staked Ether",
        "iconUrl": "https://cdn.coinranking.com/UJ-dQdgYY/8085.png",
        "address": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84"
    },
    {
        "id": "TON",
        "symbol": "TON",
        "name": "Toncoin",
        "iconUrl": "https://cdn.coinranking.com/1mf2KPPah/toncoin.png",
        "address": "0x582d872a1b094fc48f5de31d3b73f2d9be47def1"
    },
    {
        "id": "wstETH",
        "symbol": "wstETH",
        "name": "Wrapped liquid staked Ether 2.0",
        "iconUrl": "https://cdn.coinranking.com/LQg69oxqx/wstETH.PNG",
        "address": "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0"
    },
    {
        "id": "WBTC",
        "symbol": "WBTC",
        "name": "Wrapped BTC",
        "iconUrl": "https://cdn.coinranking.com/o3-8cvCHu/wbtc[1].svg",
        "address": "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"
    },
    {
        "id": "WETH",
        "symbol": "WETH",
        "name": "Wrapped Ether",
        "iconUrl": "https://cdn.coinranking.com/KIviQyZlt/weth.svg",
        "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    },
    {
        "id": "SHIB",
        "symbol": "SHIB",
        "name": "Shiba Inu",
        "iconUrl": "https://cdn.coinranking.com/fiZ4HfnRR/shib.png",
        "address": "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE"
    },
    {
        "id": "LINK",
        "symbol": "LINK",
        "name": "Chainlink",
        "iconUrl": "https://cdn.coinranking.com/9NOP9tOem/chainlink.svg",
        "address": "0x514910771af9ca656af840dff83e8264ecf986ca"
    },
    {
        "id": "UNI",
        "symbol": "UNI",
        "name": "Uniswap",
        "iconUrl": "https://cdn.coinranking.com/1heSvUgtl/uniswap-v2.svg?size=48x48",
        "address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
    },
    {
        "id": "DAI",
        "symbol": "DAI",
        "name": "Dai",
        "iconUrl": "https://cdn.coinranking.com/mAZ_7LwOE/mutli-collateral-dai.svg",
        "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    },
    {
        "id": "MATIC",
        "symbol": "MATIC",
        "name": "Polygon",
        "iconUrl": "https://cdn.coinranking.com/M-pwilaq-/polygon-matic-logo.svg",
        "address": "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0"
    },
    {
        "id": "PEPE",
        "symbol": "PEPE",
        "name": "PEPE",
        "iconUrl": "https://cdn.coinranking.com/L9KYPBnG8/pepe_32.PNG",
        "address": "0x6982508145454Ce325dDbE47a25d4ec3d2311933"
    },
    {
        "id": "USDE",
        "symbol": "USDE",
        "name": "USDe",
        "iconUrl": "https://cdn.coinranking.com/qKumrPI5t/USDe.png",
        "address": "0x4c9edd5852cd905f086c759e8383e09bff1e68b3"
    },
    {
        "id": "CAKE",
        "symbol": "CAKE",
        "name": "PancakeSwap",
        "iconUrl": "https://cdn.coinranking.com/aRtgdw7bQ/pancakeswap-cake-logo.png",
        "address": "0x152649eA73beAb28c5b49B26eb48f7EAD6d4c898"
    },
    {
        "id": "NEAR",
        "symbol": "NEAR",
        "name": "NEAR Protocol",
        "iconUrl": "https://cdn.coinranking.com/Cth83dCnl/near.png",
        "address": "0x85f17cf997934a597031b2e18a9ab6ebd4b9f6a4"
    },
    {
        "id": "FET",
        "symbol": "FET",
        "name": "Fetch.AI",
        "iconUrl": "https://cdn.coinranking.com/8w7heKkw8/yrtftru.png",
        "address": "0xaea46a60368a7bd060eec7df8cba43b7ef41ad85"
    },
    {
        "id": "IMX",
        "symbol": "IMX",
        "name": "Immutable X",
        "iconUrl": "https://cdn.coinranking.com/naRGT2Y_X/10603.png",
        "address": "0xF57e7e7C23978C3cAEC3C3548E3D615c346e79fF"
    },
    {
        "id": "MKR",
        "symbol": "MKR",
        "name": "Maker",
        "iconUrl": "https://cdn.coinranking.com/sjHfS7jCS/mkrdao.svg",
        "address": "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2"
    },
    {
        "id": "OKB",
        "symbol": "OKB",
        "name": "OKB",
        "iconUrl": "https://cdn.coinranking.com/xcZdYtX6E/okx.png",
        "address": "0x75231f58b43240c9718dd58b4967c5114342a86c"
    },
    {
        "id": "MNT",
        "symbol": "MNT",
        "name": "Mantle",
        "iconUrl": "https://cdn.coinranking.com/lXjHdEmpI/bLhE1aY1_400x400.PNG",
        "address": "0x3c3a81e81dc49a522a592e7622a7e711c06bf354"
    },
    {
        "id": "RNDR",
        "symbol": "RNDR",
        "name": "Render Token",
        "iconUrl": "https://cdn.coinranking.com/lhbmnCedl/5690.png",
        "address": "0x6de037ef9ad2725eb40118bb1702ebb27e4aeb24"
    },
    {
        "id": "INJ",
        "symbol": "INJ",
        "name": "Injective Protocol",
        "iconUrl": "https://cdn.coinranking.com/C5hRj9m6a/injective-protocol-logo.png",
        "address": "0xe28b3b32b6c345a34ff64674606124dd5aceca30"
    },
    {
        "id": "FDUSD",
        "symbol": "FDUSD",
        "name": "First Digital USD",
        "iconUrl": "https://cdn.coinranking.com/Fsc8c3dOQ/Kegnv2no_400x400.PNG",
        "address": "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409"
    },
    {
        "id": "WBT",
        "symbol": "WBT",
        "name": "WhiteBIT Coin",
        "iconUrl": "https://cdn.coinranking.com/pgJ21zFKK/WBT_250x250px.png",
        "address": "0x925206b8a707096Ed26ae47C84747fE0bb734F59"
    },
    {
        "id": "ATOM",
        "symbol": "ATOM",
        "name": "Cosmos",
        "iconUrl": "https://cdn.coinranking.com/HJzHboruM/atom.svg",
        "address": "0x8D983cb9388EaC77af0474fA441C4815500Cb7BB"
    },
    {
        "id": "ONDO",
        "symbol": "ONDO",
        "name": "ONDO",
        "iconUrl": "https://cdn.coinranking.com/ntSfLv-Es/ONDO.png",
        "address": "0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3"
    },
    {
        "id": "AAVE",
        "symbol": "AAVE",
        "name": "Aave",
        "iconUrl": "https://cdn.coinranking.com/A_PrSs460/aave.png",
        "address": "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9"
    },
    {
        "id": "BGB",
        "symbol": "BGB",
        "name": "Bitget Token",
        "iconUrl": "https://cdn.coinranking.com/XFggEy_nx/bgb.png",
        "address": "0x19de6b897Ed14A376Dda0Fe53a5420D2aC828a28"
    },
    {
        "id": "GRT",
        "symbol": "GRT",
        "name": "The Graph",
        "iconUrl": "https://cdn.coinranking.com/g6FVr-7Vs/grt.png",
        "address": "0xc944e90c64b2c07662a292be6244bdf05cda44a7"
    },
    {
        "id": "ZBU",
        "symbol": "ZBU",
        "name": "ZEEBU",
        "iconUrl": "https://cdn.coinranking.com/3l1F-tZDE/SVG_168984371594075290.PNG",
        "address": "0x8f9b4525681F3Ea6E43b8E0a57BFfF86c0A1dd2e"
    },
    {
        "id": "ezETH",
        "symbol": "ezETH",
        "name": "Renzo Restaked ETH",
        "iconUrl": "https://cdn.coinranking.com/YEV062ygp/EZETH.png",
        "address": "0xbf5495Efe5DB9ce00f80364C8B423567e58d2110"
    },
    {
        "id": "FLOKI",
        "symbol": "FLOKI",
        "name": "FLOKI",
        "iconUrl": "https://cdn.coinranking.com/Yfn5I1O01/10804.png",
        "address": "0x43f11c02439e2736800433b4594994bd43cd066d"
    },
    {
        "id": "LDO",
        "symbol": "LDO",
        "name": "Lido DAO Token",
        "iconUrl": "https://cdn.coinranking.com/Wp6LFY6ZZ/8000.png",
        "address": "0x5a98fcbea516cf06857215779fd812ca3bef1b32"
    },
    {
        "id": "THETA",
        "symbol": "THETA",
        "name": "Theta Token",
        "iconUrl": "https://cdn.coinranking.com/HJHg2k9Lf/theta.svg",
        "address": "0x3883f5e181fccaF8410FA61e12b59BAd963fb645"
    },
    {
        "id": "CRO",
        "symbol": "CRO",
        "name": "Cronos",
        "iconUrl": "https://cdn.coinranking.com/2o91jm73M/cro.svg",
        "address": "0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b"
    },
    {
        "id": "NEXO",
        "symbol": "NEXO",
        "name": "Nexo",
        "iconUrl": "https://cdn.coinranking.com/V2znfjzI4/nexo.svg",
        "address": "0xb62132e35a6c13ee1ee0f84dc5d40bad8d815206"
    },
    {
        "id": "OM",
        "symbol": "OM",
        "name": "Mantra DAO",
        "iconUrl": "https://cdn.coinranking.com/ljdgopkOU/6536.png",
        "address": "0x3593d125a4f7849a1b059e64f4517a86dd60c95d"
    },
    {
        "id": "BONK",
        "symbol": "BONK",
        "name": "Bonk",
        "iconUrl": "https://cdn.coinranking.com/8YnJOyn2H/bonk.png",
        "address": "0x1151cb3d861920e07a38e03eead12c32178567f6"
    },
    {
        "id": "ZRO",
        "symbol": "ZRO",
        "name": "LayerZero",
        "iconUrl": "https://cdn.coinranking.com/tfF7o2J6H/ZRO_LOGO.png",
        "address": "0x6985884C4392D348587B19cb9eAAf157F13271cd"
    },
    {
        "id": "GT",
        "symbol": "GT",
        "name": "GateToken",
        "iconUrl": "https://cdn.coinranking.com/tRE6BrzE0/GT[1].svg",
        "address": "0xe66747a101bff2dba3697199dcce5b743b454759"
    },
    {
        "id": "WEMIX",
        "symbol": "WEMIX",
        "name": "WEMIX Token",
        "iconUrl": "https://cdn.coinranking.com/1N84MQsoO/7548.png",
        "address": "0x401fd65efb9dfa1f7a12ddcc62ee78e3e8b3c96c"
    },
    {
        "id": "BABYDOGE",
        "symbol": "BABYDOGE",
        "name": "Baby Doge Coin",
        "iconUrl": "https://cdn.coinranking.com/1X2BCCJdV/Baby_Doge.png",
        "address": "0xac57de9c1a09fec648e93eb98875b212db0d460b"
    },
    {
        "id": "BEAM",
        "symbol": "BEAM",
        "name": "BEAM",
        "iconUrl": "https://cdn.coinranking.com/uMTxLbtWN/BEAM.png",
        "address": "0x62d0a8458ed7719fdaf978fe5929c6d342b0bfce"
    },
    {
        "id": "ARB",
        "symbol": "ARB",
        "name": "ARBITRUM",
        "iconUrl": "https://cdn.coinranking.com/8Lx2RDCtw/arbitrum.svg",
        "address": "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1"
    },
    {
        "id": "BTT",
        "symbol": "BTT",
        "name": "BitTorrent-New",
        "iconUrl": "https://cdn.coinranking.com/xHIci4Je9/16086.png",
        "address": "0xc669928185dbce49d2230cc9b0979be6dc797957"
    },
    {
        "id": "ENS",
        "symbol": "ENS",
        "name": "Ethereum Name Service",
        "iconUrl": "https://cdn.coinranking.com/aUQr3CkJU/ENS.png",
        "address": "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72"
    },
    {
        "id": "RAY",
        "symbol": "RAY",
        "name": "Raydium",
        "iconUrl": "https://cdn.coinranking.com/ClZxN_xIa/8526.png",
        "address": "0x5245c0249e5eeb2a0838266800471fd32adb1089"
    }
];

async function token_breakdown_against_wallet(req, res) {
    const walletId = req.params.walletId;

    try {
        let alchemyInstance = getAlchemy();

        // Step 1: Filter ERC20 tokens
        const erc20TokensToFilter = ['DAI', 'USDC', 'USDT', 'WBTC', 'WETH'];
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
        console.error(err);
        res.status(500).json({ success: false, message: `Error in tokenBreakdownAgainstWallet: ${err.message}` });
    }
}

function test(req, res) {
    let alchemy = getAlchemy();
    logger.info(alchemy);
    res.send({ network: Environment.NETWORK_ID });
}

export const walletController = { token_breakdown_against_wallet, test };