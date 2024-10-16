import axios from 'axios';
import Environment from '../config';


const namespaceOffchainApi = axios.create({
  baseURL: Environment.NAMESPACE_OFFCHAIN_API_BASE_URL,
  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Environment.NAMESPACE_API_KEY}` },
});

namespaceOffchainApi.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
);

export const mintOffchainSubnameApi = (mintParams) => {
  return namespaceOffchainApi.post(`/v1/subname/mint`, mintParams);
};

export const checkOffchainSubnameAvailabilityApi = (subnameLabel, listedDomain) => {
  return namespaceOffchainApi.get(`/v1/subname/availability/${subnameLabel}/${listedDomain}`);
};
