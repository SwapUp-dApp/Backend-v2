import Environment from "../config";
require("dotenv").config();

const currentEnvironmentKey = Environment.ENVIRONMENT_KEY || 'development';

/**
 * @typedef {Object} DatabaseEnvironmentConfig
 * @property {string} dialect
 * @property {string} migrationStorage
 * @property {string} migrationStoragePath
 * @property {string} seederStorage
 * @property {string} seederStoragePath
 */

/**
 * @type {Object<string, DatabaseEnvironmentConfig>}
 */


const dbConfig = {
  "local": {
    "dialect": "mssql",
    "migrationStorage": "json", // Use a different storage type. Default: sequelize
    "migrationStoragePath": "sequelizeMeta.json", // Use a different file name. Default: sequelize-meta.json
    "seederStorage": "json", // Use a different storage. Default: none
    "seederStoragePath": "sequelizeData.json", // Use a different file name. Default: sequelize-data.json
  },

  "development": {
    "dialect": "mssql",
    "migrationStorage": "json", // Use a different storage type. Default: sequelize
    "migrationStoragePath": "sequelizeMeta.json", // Use a different file name. Default: sequelize-meta.json
    "seederStorage": "json", // Use a different storage. Default: none
    "seederStoragePath": "sequelizeData.json", // Use a different file name. Default: sequelize-data.json
  },

  "staging": {
    "dialect": "mssql",
    "migrationStorage": "json", // Use a different storage type. Default: sequelize
    "migrationStoragePath": "sequelizeMeta.json", // Use a different file name. Default: sequelize-meta.json
    "seederStorage": "json", // Use a different storage. Default: none
    "seederStoragePath": "sequelizeData.json", // Use a different file name. Default: sequelize-data.json
  },

  "production": {
    "dialect": "mssql",
    "migrationStorage": "json", // Use a different storage type. Default: sequelize
    "migrationStoragePath": "sequelizeMeta.json", // Use a different file name. Default: sequelize-meta.json
    "seederStorage": "json", // Use a different storage. Default: none
    "seederStoragePath": "sequelizeData.json", // Use a different file name. Default: sequelize-data.json
  },
};

const databaseConfiguration = dbConfig[currentEnvironmentKey];

export default databaseConfiguration;
