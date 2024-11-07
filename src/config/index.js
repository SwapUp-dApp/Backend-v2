require("dotenv").config();

const swapupEnvironmentKey = process.env.SWAPUP_ENVIRONMENT_KEY || 'development';

/**
 * @typedef {Object} EnvironmentConfig
 * @property {"local" | "development" | "staging" | "production"} ENVIRONMENT_KEY
 * @property {number} ENVIRONMENT_ID
 * @property {number} NETWORK_ID
 * @property {string} ALCHEMY_KEY
 * @property {number} PORT
 * @property {number} API_RATE_WINDOW
 * @property {number} API_RATE_LIMIT
 * @property {number} API_PAYLOAD_LIMIT
 * @property {string} DB_NAME
 * @property {string} DB_USER
 * @property {string} DB_PWD
 * @property {string} DB_HOST
 * @property {number} DB_PORT
 * @property {string} THIRDWEB_PAYMENT_WEBHOOK_SECRET_KEY
 * @property {string} TWITTER_API_KEY
 * @property {string} TWITTER_API_SECRET_KEY
 * @property {string} TWITTER_ACCESS_TOKEN
 * @property {string} TWITTER_ACCESS_SECRET
 * @property {string} TWITTER_CLIENT_ID
 * @property {string} TWITTER_CLIENT_SECRET
 * @property {string} TWITTER_BEARER_TOKEN
 * @property {string} AZURE_BLOB_STORAGE_SAS_URL
 * @property {string} AZURE_BLOB_STORAGE_SAS_TOKEN
 * @property {string} AZURE_BLOB_STORAGE_ACCOUNT_NAME
 * @property {string} AZURE_BLOB_STORAGE_CONTAINER_NAME
 * @property {string} NAMESPACE_OFFCHAIN_API_BASE_URL
 * @property {string} NAMESPACE_API_KEY
 * @property {string} SWAPUP_TREASURY_SMART_ACCOUNT
 * @property {string} SWAPUP_TREASURY_API_KEY
 * @property {string} THIRDWEB_CLIENT_ID
 */

/**
 * @type {Object<string, EnvironmentConfig>}
 */

const config = {
  "local": {
    ENVIRONMENT_KEY: process.env.LOCAL_ENVIRONMENT_KEY,
    ENVIRONMENT_ID: Number(process.env.LOCAL_ENVIRONMENT_ID),
    NETWORK_ID: Number(process.env.LOCAL_NETWORK_ID),
    ALCHEMY_KEY: process.env.LOCAL_ALCHEMY_KEY,
    PORT: Number(process.env.LOCAL_PORT),
    API_RATE_WINDOW: Number(process.env.LOCAL_API_RATE_WINDOW),
    API_RATE_LIMIT: Number(process.env.LOCAL_API_RATE_LIMIT),
    API_PAYLOAD_LIMIT: Number(process.env.LOCAL_API_PAYLOAD_LIMIT),
    DB_NAME: process.env.LOCAL_DB_NAME,
    DB_USER: process.env.LOCAL_DB_USER,
    DB_PWD: process.env.LOCAL_DB_PWD,
    DB_HOST: process.env.LOCAL_DB_HOST,
    DB_PORT: Number(process.env.LOCAL_DB_PORT),
    THIRDWEB_PAYMENT_WEBHOOK_SECRET_KEY: process.env.LOCAL_THIRDWEB_PAYMENT_WEBHOOK_SECRET_KEY,
    TWITTER_API_KEY: process.env.TWITTER_API_KEY,
    TWITTER_API_SECRET_KEY: process.env.TWITTER_API_SECRET_KEY,
    TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET,
    TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
    AZURE_BLOB_STORAGE_SAS_URL: process.env.AZURE_BLOB_STORAGE_SAS_URL,
    AZURE_BLOB_STORAGE_SAS_TOKEN: process.env.AZURE_BLOB_STORAGE_SAS_TOKEN,
    AZURE_BLOB_STORAGE_ACCOUNT_NAME: process.env.AZURE_BLOB_STORAGE_ACCOUNT_NAME,
    AZURE_BLOB_STORAGE_CONTAINER_NAME: process.env.AZURE_BLOB_STORAGE_CONTAINER_NAME,
    NAMESPACE_OFFCHAIN_API_BASE_URL: process.env.NAMESPACE_OFFCHAIN_API_BASE_URL,
    NAMESPACE_API_KEY: process.env.NAMESPACE_API_KEY,
    SWAPUP_TREASURY_SMART_ACCOUNT: process.env.SWAPUP_TREASURY_SMART_ACCOUNT,
    SWAPUP_TREASURY_API_KEY: process.env.SWAPUP_TREASURY_API_KEY,
    THIRDWEB_CLIENT_ID: process.env.THIRDWEB_CLIENT_ID,
  },

  "development": {
    ENVIRONMENT_KEY: process.env.DEVELOPMENT_ENVIRONMENT_KEY,
    ENVIRONMENT_ID: Number(process.env.DEVELOPMENT_ENVIRONMENT_ID),
    NETWORK_ID: Number(process.env.DEVELOPMENT_NETWORK_ID),
    ALCHEMY_KEY: process.env.DEVELOPMENT_ALCHEMY_KEY,
    PORT: Number(process.env.DEVELOPMENT_PORT),
    API_RATE_WINDOW: Number(process.env.DEVELOPMENT_API_RATE_WINDOW),
    API_RATE_LIMIT: Number(process.env.DEVELOPMENT_API_RATE_LIMIT),
    API_PAYLOAD_LIMIT: Number(process.env.DEVELOPMENT_API_PAYLOAD_LIMIT),
    DB_NAME: process.env.DEVELOPMENT_DB_NAME,
    DB_USER: process.env.DEVELOPMENT_DB_USER,
    DB_PWD: process.env.DEVELOPMENT_DB_PWD,
    DB_HOST: process.env.DEVELOPMENT_DB_HOST,
    DB_PORT: Number(process.env.DEVELOPMENT_DB_PORT),
    THIRDWEB_PAYMENT_WEBHOOK_SECRET_KEY: process.env.DEVELOPMENT_THIRDWEB_PAYMENT_WEBHOOK_SECRET_KEY,
    TWITTER_API_KEY: process.env.TWITTER_API_KEY,
    TWITTER_API_SECRET_KEY: process.env.TWITTER_API_SECRET_KEY,
    TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET,
    TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
    AZURE_BLOB_STORAGE_SAS_URL: process.env.AZURE_BLOB_STORAGE_SAS_URL,
    AZURE_BLOB_STORAGE_SAS_TOKEN: process.env.AZURE_BLOB_STORAGE_SAS_TOKEN,
    AZURE_BLOB_STORAGE_ACCOUNT_NAME: process.env.AZURE_BLOB_STORAGE_ACCOUNT_NAME,
    AZURE_BLOB_STORAGE_CONTAINER_NAME: process.env.AZURE_BLOB_STORAGE_CONTAINER_NAME,
    NAMESPACE_OFFCHAIN_API_BASE_URL: process.env.NAMESPACE_OFFCHAIN_API_BASE_URL,
    NAMESPACE_API_KEY: process.env.NAMESPACE_API_KEY,
    SWAPUP_TREASURY_SMART_ACCOUNT: process.env.SWAPUP_TREASURY_SMART_ACCOUNT,
    SWAPUP_TREASURY_API_KEY: process.env.SWAPUP_TREASURY_API_KEY,
    THIRDWEB_CLIENT_ID: process.env.THIRDWEB_CLIENT_ID,
  },

  "staging": {
    ENVIRONMENT_KEY: process.env.STAGING_ENVIRONMENT_KEY,
    ENVIRONMENT_ID: Number(process.env.STAGING_ENVIRONMENT_ID),
    NETWORK_ID: Number(process.env.STAGING_NETWORK_ID),
    ALCHEMY_KEY: process.env.STAGING_ALCHEMY_KEY,
    PORT: Number(process.env.STAGING_PORT),
    API_RATE_WINDOW: Number(process.env.STAGING_API_RATE_WINDOW),
    API_RATE_LIMIT: Number(process.env.STAGING_API_RATE_LIMIT),
    API_PAYLOAD_LIMIT: Number(process.env.STAGING_API_PAYLOAD_LIMIT),
    DB_NAME: process.env.STAGING_DB_NAME,
    DB_USER: process.env.STAGING_DB_USER,
    DB_PWD: process.env.STAGING_DB_PWD,
    DB_HOST: process.env.STAGING_DB_HOST,
    DB_PORT: Number(process.env.STAGING_DB_PORT),
    THIRDWEB_PAYMENT_WEBHOOK_SECRET_KEY: process.env.STAGING_THIRDWEB_PAYMENT_WEBHOOK_SECRET_KEY,
    TWITTER_API_KEY: process.env.TWITTER_API_KEY,
    TWITTER_API_SECRET_KEY: process.env.TWITTER_API_SECRET_KEY,
    TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET,
    TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
    AZURE_BLOB_STORAGE_SAS_URL: process.env.AZURE_BLOB_STORAGE_SAS_URL,
    AZURE_BLOB_STORAGE_SAS_TOKEN: process.env.AZURE_BLOB_STORAGE_SAS_TOKEN,
    AZURE_BLOB_STORAGE_ACCOUNT_NAME: process.env.AZURE_BLOB_STORAGE_ACCOUNT_NAME,
    AZURE_BLOB_STORAGE_CONTAINER_NAME: process.env.AZURE_BLOB_STORAGE_CONTAINER_NAME,
    NAMESPACE_OFFCHAIN_API_BASE_URL: process.env.NAMESPACE_OFFCHAIN_API_BASE_URL,
    NAMESPACE_API_KEY: process.env.NAMESPACE_API_KEY,
    SWAPUP_TREASURY_SMART_ACCOUNT: process.env.SWAPUP_TREASURY_SMART_ACCOUNT,
    SWAPUP_TREASURY_API_KEY: process.env.SWAPUP_TREASURY_API_KEY,
    THIRDWEB_CLIENT_ID: process.env.THIRDWEB_CLIENT_ID,
  },

  "production": {
    ENVIRONMENT_KEY: process.env.PRODUCTION_ENVIRONMENT_KEY,
    ENVIRONMENT_ID: Number(process.env.PRODUCTION_ENVIRONMENT_ID),
    NETWORK_ID: Number(process.env.PRODUCTION_NETWORK_ID),
    ALCHEMY_KEY: process.env.PRODUCTION_ALCHEMY_KEY,
    PORT: Number(process.env.PRODUCTION_PORT),
    API_RATE_WINDOW: Number(process.env.PRODUCTION_API_RATE_WINDOW),
    API_RATE_LIMIT: Number(process.env.PRODUCTION_API_RATE_LIMIT),
    API_PAYLOAD_LIMIT: Number(process.env.PRODUCTION_API_PAYLOAD_LIMIT),
    DB_NAME: process.env.PRODUCTION_DB_NAME,
    DB_USER: process.env.PRODUCTION_DB_USER,
    DB_PWD: process.env.PRODUCTION_DB_PWD,
    DB_HOST: process.env.PRODUCTION_DB_HOST,
    DB_PORT: Number(process.env.PRODUCTION_DB_PORT),
    THIRDWEB_PAYMENT_WEBHOOK_SECRET_KEY: process.env.PRODUCTION_THIRDWEB_PAYMENT_WEBHOOK_SECRET_KEY,
    TWITTER_API_KEY: process.env.TWITTER_API_KEY,
    TWITTER_API_SECRET_KEY: process.env.TWITTER_API_SECRET_KEY,
    TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET,
    TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
    AZURE_BLOB_STORAGE_SAS_URL: process.env.AZURE_BLOB_STORAGE_SAS_URL,
    AZURE_BLOB_STORAGE_SAS_TOKEN: process.env.AZURE_BLOB_STORAGE_SAS_TOKEN,
    AZURE_BLOB_STORAGE_ACCOUNT_NAME: process.env.AZURE_BLOB_STORAGE_ACCOUNT_NAME,
    AZURE_BLOB_STORAGE_CONTAINER_NAME: process.env.AZURE_BLOB_STORAGE_CONTAINER_NAME,
    NAMESPACE_OFFCHAIN_API_BASE_URL: process.env.NAMESPACE_OFFCHAIN_API_BASE_URL,
    NAMESPACE_API_KEY: process.env.NAMESPACE_API_KEY,
    SWAPUP_TREASURY_SMART_ACCOUNT: process.env.SWAPUP_TREASURY_SMART_ACCOUNT,
    SWAPUP_TREASURY_API_KEY: process.env.SWAPUP_TREASURY_API_KEY,
    THIRDWEB_CLIENT_ID: process.env.THIRDWEB_CLIENT_ID,
  },
};

const Environment = config[swapupEnvironmentKey];

export default Environment;
