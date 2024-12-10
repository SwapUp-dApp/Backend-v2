'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SubscriptionTokens extends Model {
    static associate(models) {
      // Define associations here, if any
    }
  }

  SubscriptionTokens.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      symbol: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      iconUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      chainId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      usdAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      tradeCharges: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'SubscriptionTokens'
    }
  );


  return SubscriptionTokens;
};
