import Sequelize from "sequelize";
import logger from "../../logger/index.js";
import dbConfig from "../config.js";
require("dotenv").config();

const databaseConfiguration = dbConfig;
const db = {};

let sequelize = new Sequelize({
    database: databaseConfiguration.database,
    username: databaseConfiguration.username,
    password: databaseConfiguration.password,
    port: databaseConfiguration.port || 1433,
    host: databaseConfiguration.host, //tcp:swapup-dev.database.windows.net,1433
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
db.notifications = require("./notifications.js")(sequelize, Sequelize);
db.subscriptionTokens = require("./subscriptionTokens.js")(sequelize, Sequelize);

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
