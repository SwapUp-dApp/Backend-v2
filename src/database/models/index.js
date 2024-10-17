import Sequelize from "sequelize";
import databaseConfiguration from "../db.config.js";
import Environment from "../../config";
import logger from "../../logger/index.js";


const db = {};

let sequelize = new Sequelize({
    database: Environment.DB_NAME,
    username: Environment.DB_USER,
    password: Environment.DB_PWD,
    port: Environment.DB_PORT,
    host: Environment.DB_HOST, //tcp:swapup-dev.database.windows.net,1433
    dialect: databaseConfiguration.dialect || "mssql",
    encrypt: true,
    dialectOptions: {
        encrypt: true,
        packetSize: 32768,
        options: { useUTC: false, dateFirst: 1 }
        //authentication: { options: { userName: dbServerCredentials.userName,//<svc account>@<my-company.com>@<database server>,  password: dbServerCredentials.password,// <svc account password> }, type: 'azure-active-directory-password', }, }, });
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    logging: (msg) => logger.info("sequelize --> " + msg),
});


try {
    sequelize.authenticate();
    logger.info('sequelize --> Connection has been established successfully.');
} catch (error) {
    logger.error(`sequelize --> Unable to connect to the database: ${error.message}`);
}


//TODO: Manually expose all models here
db.users = require("./user.js")(sequelize, Sequelize);
db.swaps = require("./swap.js")(sequelize, Sequelize);
db.payments = require("./payments.js")(sequelize, Sequelize);

// Synchronize all models with the database, creating tables if they don't exist
// **** ONLY TO BE USED WITHIN DEV EVNIRONMENT FOR FIRST TIME SETUP **** //
// sequelize.sync()
//     .then(() => {
//         logger.info('All models were synchronized successfully.');
//     })
//     .catch(err => {
//         logger.error('An error occurred while synchronizing models:', err);
//     });

db.sequelize = sequelize;
db.Sequelize = Sequelize;


export default db;
