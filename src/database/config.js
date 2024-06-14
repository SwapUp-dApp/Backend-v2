require("dotenv").config();
console.log("sequelize config: ", process.env.NODE_ENV, "it is being loaded correctly");
const configuration = {
  "development": {
    "username": process.env.DB_USER,
    "password": process.env.DB_PWD,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "dialect": "mssql",
    "port": process.env.DB_PORT || 1433,
    "migrationStorage": "json", // Use a different storage type. Default: sequelize
    "migrationStoragePath": "sequelizeMeta.json", // Use a different file name. Default: sequelize-meta.json
    "seederStorage": "json", // Use a different storage. Default: none
    "seederStoragePath": "sequelizeData.json", // Use a different file name. Default: sequelize-data.json
  },
  "test": {
    "username": process.env.DB_USER,
    "password": process.env.DB_PWD,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "dialect": "mssql",
    "port": process.env.DB_PORT || 1433,
    "migrationStorage": "json", // Use a different storage type. Default: sequelize
    "migrationStoragePath": "sequelizeMeta.json", // Use a different file name. Default: sequelize-meta.json
    "seederStorage": "json", // Use a different storage. Default: none
    "seederStoragePath": "sequelizeData.json", // Use a different file name. Default: sequelize-data.json
  },
  "production": {
    "username": process.env.DB_USER,
    "password": process.env.DB_PWD,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "dialect": "mssql",
    "port": process.env.DB_PORT || 1433,
    "migrationStorage": "json", // Use a different storage type. Default: sequelize
    "migrationStoragePath": "sequelizeMeta.json", // Use a different file name. Default: sequelize-meta.json
    "seederStorage": "json", // Use a different storage. Default: none
    "seederStoragePath": "sequelizeData.json", // Use a different file name. Default: sequelize-data.json
  }
};
// console.log(configuration);
module.exports = configuration;
