require("dotenv").config();

const swapupEnvironmentKey = process.env.SWAPUP_ENVIRONMENT_KEY || 'development';

/**
 * @typedef {Object} DatabaseEnvironmentConfig
 * @property {string} username
 * @property {string} password
 * @property {string} database
 * @property {string} host
 * @property {number} port
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
    database: process.env.LOCAL_DB_NAME,
    username: process.env.LOCAL_DB_USER,
    password: process.env.LOCAL_DB_PWD,
    host: process.env.LOCAL_DB_HOST,
    port: Number(process.env.LOCAL_DB_PORT),
    dialect: "mssql",
    migrationStorage: "json",
    migrationStoragePath: "sequelizeMeta.json",
    seederStorage: "json",
    seederStoragePath: "sequelizeData.json",
  },

  "development": {
    database: process.env.DEVELOPMENT_DB_NAME,
    username: process.env.DEVELOPMENT_DB_USER,
    password: process.env.DEVELOPMENT_DB_PWD,
    host: process.env.DEVELOPMENT_DB_HOST,
    port: Number(process.env.DEVELOPMENT_DB_PORT),
    dialect: "mssql",
    migrationStorage: "json",
    migrationStoragePath: "sequelizeMeta.json",
    seederStorage: "json",
    seederStoragePath: "sequelizeData.json",
  },

  "staging": {
    database: process.env.STAGING_DB_NAME,
    username: process.env.STAGING_DB_USER,
    password: process.env.STAGING_DB_PWD,
    host: process.env.STAGING_DB_HOST,
    port: Number(process.env.STAGING_DB_PORT),
    dialect: "mssql",
    migrationStorage: "json",
    migrationStoragePath: "sequelizeMeta.json",
    seederStorage: "json",
    seederStoragePath: "sequelizeData.json",
  },

  "production": {
    database: process.env.PRODUCTION_DB_NAME,
    username: process.env.PRODUCTION_DB_USER,
    password: process.env.PRODUCTION_DB_PWD,
    host: process.env.PRODUCTION_DB_HOST,
    port: Number(process.env.PRODUCTION_DB_PORT),
    dialect: "mssql",
    migrationStorage: "json",
    migrationStoragePath: "sequelizeMeta.json",
    seederStorage: "json",
    seederStoragePath: "sequelizeData.json",
  },

};

module.exports = dbConfig[swapupEnvironmentKey];
