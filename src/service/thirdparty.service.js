import axios from 'axios';


const namespaceOffchainApi = axios.create({
  baseURL: process.env.NAMESPACE_OFFCHAIN_API_BASE_URL,
  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.NAMESPACE_API_KEY}` },
});

namespaceOffchainApi.interceptors.response.use(
  response => response,
  error => {
    console.log(
      "Error in Response Interceptor:",
      JSON.stringify(error?.response || error?.message),
    );
    return Promise.reject(error);
  }
);

export const mintOffchainSubnameApi = (mintParams) => {
  return namespaceOffchainApi.post(`/v1/subname/mint`, mintParams);
};

export const checkOffchainSubnameAvailabilityApi = (subnameLabel, listedDomain) => {
  return namespaceOffchainApi.get(`/v1/subname/availability/${subnameLabel}/${listedDomain}`);
};
