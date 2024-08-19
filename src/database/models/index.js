import Sequelize from "sequelize";
import configuration from "../config.js";

const env = process.env.NODE_ENV || "development";
const config = configuration[env];
const db = {};

let sequelize = new Sequelize({
    database: config.database,
    username: config.username,
    password: config.password,
    host: config.host, //tcp:swapup-dev.database.windows.net,1433
    dialect: config.dialect || "mssql",
    encrypt: true,
    port: config.port,
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
    }
});


try {
    sequelize.authenticate();
    console.log('Connection has been established successfully.');
} catch (error) {
    console.error('Unable to connect to the database:', error);
}


//TODO: Manually expose all models here
db.users = require("./user.js")(sequelize, Sequelize);
db.swaps = require("./swap.js")(sequelize, Sequelize);

// Synchronize all models with the database, creating tables if they don't exist
// **** ONLY TO BE USED WITHIN DEV EVNIRONMENT FOR FIRST TIME SETUP **** //
sequelize.sync()
    .then(() => {
        console.log('All models were synchronized successfully.');
    })
    .catch(err => {
        console.error('An error occurred while synchronizing models:', err);
    });

db.sequelize = sequelize;
db.Sequelize = Sequelize;


export default db;
