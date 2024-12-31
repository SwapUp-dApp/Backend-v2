
export const convertBlockscoutToCoinRankingFormat = (symbol, tokenData, chain = "base") => {
  return {
    uuid: tokenData.address,
    symbol: tokenData.symbol || symbol,
    name: tokenData.name,
    color: "",
    iconUrl: tokenData.icon_url || '',
    marketCap: tokenData.circulating_market_cap || "0",
    price: tokenData.exchange_rate || "0",
    listedAt: 0,
    tier: 0,
    change: "",
    rank: 0,
    sparkline: "",
    lowVolume: false,
    coinrankingUrl: "",
    "24hVolume": tokenData.volume_24h || "0",
    btcPrice: "",
    contractAddresses: [`${chain}/${tokenData.address}`],
  };
};