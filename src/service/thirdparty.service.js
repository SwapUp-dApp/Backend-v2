import axios from 'axios';
import Environment from '../config';
import logger from '../logger';

/*=== Coin Ranking - endpoints start here ===*/
const coinRankingApi = axios.create({
  baseURL: Environment.COIN_RANKING_BASE_URL,
  headers: { "Content-Type": "application/json", "x-access-token": Environment.COIN_RANKING_API_KEY },
});

coinRankingApi.interceptors.response.use(
  response => response,
  error => {
    logger.error(
      "Error in Response Interceptor:",
      JSON.stringify(error?.response || error?.message),
    );
    return Promise.reject(error);
  }
);

export const getCoinRankingCurrenciesApi = (queryParams = {}) => {
  const queryString = Object.entries(queryParams)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        // Serialize array values properly
        return value.map((v) => `${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`).join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
  return coinRankingApi.get(`/v2/coins?${queryString}`);
};
/*=== Coin Ranking - endpoints end here ===*/


/*=== Block Scout - endpoints start here ===*/
const baseBlockscoutApi = axios.create({
  baseURL: Environment.BLOCKSCOUT_BASE_URL,
  headers: { accept: 'application/json' },
});

baseBlockscoutApi.interceptors.response.use(
  response => response,
  error => {
    logger.error(
      "Error in Response Interceptor:",
      JSON.stringify(error?.response || error?.message),
    );
    return Promise.reject(error);
  }
);

export const getBaseBlockscoutTokenByAddressApi = (address) =>
  baseBlockscoutApi.get(`/api/v2/tokens/${address}`)
/*=== Block Scout - endpoints end here ===*/