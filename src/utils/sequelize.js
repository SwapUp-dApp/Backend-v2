import { Sequelize } from 'sequelize';

let sqlz =
    new Sequelize({
        name: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PWD,
        dialect: process.env.DB_DIALECT,
        encrypt: true,
        host: process.env.DB_HOST, //tcp:swapup-dev.database.windows.net,1433
        port: 1433,
        dialectOptions:
        {
            encrypt: true, packetSize: 32768,
            options: { useUTC: false, dateFirst: 1 },
            //authentication: { options: { userName: dbServerCredentials.userName,//<svc account>@<my-company.com>@<database server>,  password: dbServerCredentials.password,// <svc account password> }, type: 'azure-active-directory-password', }, }, });
        },
        pool:
        {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });

export default sqlz;