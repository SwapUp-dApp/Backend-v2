"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    User.init(
        {
            wallet: DataTypes.STRING,
            twitter_access: DataTypes.TEXT,
            images: DataTypes.TEXT,
            points: DataTypes.TEXT,
            title: DataTypes.STRING,
            description: DataTypes.TEXT,
            social_links: DataTypes.TEXT,
            tags: DataTypes.TEXT,
            privateKey: DataTypes.TEXT,
            smartAccount: DataTypes.TEXT
        },
        {
            sequelize,
            modelName: "User"
        }
    );
    return User;
};
