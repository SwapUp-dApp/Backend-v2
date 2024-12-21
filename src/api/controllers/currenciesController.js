import db from "../../database/models";
import Environment from "../../config";
import logger from "../../logger";
import { CustomError, handleError } from "../../errors";
import { getBaseBlockscoutTokenByAddressApi, getCoinRankingCurrenciesApi } from "../../service/thirdparty.service";
import { additionalBaseTokenAddresses } from "../../constants/params";


async function get_coin_ranking_currencies(req, res) {
  try {
    const queryParams = req.query;
    const currenciesRes = await getCoinRankingCurrenciesApi(queryParams);

    return res.status(200).json({
      success: true,
      message: "Currencies fetched successfully",
      data: currenciesRes.data,
    });

  } catch (err) {
    handleError(res, err, "get_coin_ranking_currencies: error");
  }
}

async function get_currencies_by_chain_id(req, res) {
  try {
    const chainId = req.params.chainId;

    let currenciesRes;

    switch (Number(chainId)) {
      case 8453:
        // Step - 1: Get ethereum coin
        const ethCurrencyRes = await getCoinRankingCurrenciesApi({
          blockchains: ["ethereum"],
          uuids: ["razxDUgYGNAdQ"],
        });

        // Step - 2: Get all available coins on base network
        const baseCurrenciesRes = await getCoinRankingCurrenciesApi({
          blockchains: ["base"],
          limit: 100
        });


        // Step - 3: Fetch additional tokens and convert them
        const additionalTokens = await Promise.all(
          additionalBaseTokenAddresses.map(async ({ symbol, address }) => {
            try {
              const tokenData = await getBaseBlockscoutTokenByAddressApi(address);
              return convertToCoinRankingFormat(symbol, tokenData.data);
            } catch (error) {
              logger.error(`Error fetching token data for ${symbol} on chainId ${chainId} and address ${address}:`, error);
              return null;
            }
          })
        );

        const validAdditionalTokens = additionalTokens.filter((token) => token !== null);

        // Step - 4: Combine all coins
        currenciesRes = [
          ...ethCurrencyRes.data.data.coins,
          ...baseCurrenciesRes.data.data.coins,
          ...validAdditionalTokens,
        ];
        break;

      case 1:
        const ethereumCurrenciesRes = await getCoinRankingCurrenciesApi({
          blockchains: ["ethereum"],
          limit: 100
        });
        currenciesRes = ethereumCurrenciesRes.data.data.coins;
        break;

      default:
        const defaultCurrenciesRes = await getCoinRankingCurrenciesApi({
          blockchains: ["ethereum"],
          limit: 100
        });
        currenciesRes = defaultCurrenciesRes.data.data.coins;
        break;
    }

    return res.status(200).json({
      success: true,
      message: "Currencies fetched successfully",
      data: currenciesRes,
    });

  } catch (err) {
    handleError(res, err, "get_currencies_by_chain_id: error");
  }
}


// Helper functions starts here

const convertToCoinRankingFormat = (symbol, tokenData) => {
  return {
    uuid: tokenData.address,
    symbol: tokenData.symbol || symbol,
    name: tokenData.name,
    color: null, // You can assign a default color or leave it null
    iconUrl: tokenData.icon_url || '',
    marketCap: tokenData.circulating_market_cap || "0",
    price: tokenData.exchange_rate || "0",
    listedAt: null, // No listing timestamp available
    tier: null, // No tier provided
    change: null, // No change data available
    rank: null, // You can assign a default rank or leave it null
    sparkline: null, // No sparkline data available
    lowVolume: false,
    coinrankingUrl: null, // You can construct a URL or leave it null
    "24hVolume": tokenData.volume_24h || "0",
    btcPrice: null, // No BTC price available
    contractAddresses: [`base/${tokenData.address}`],
  };
};

export const currenciesController = { get_coin_ranking_currencies, get_currencies_by_chain_id };