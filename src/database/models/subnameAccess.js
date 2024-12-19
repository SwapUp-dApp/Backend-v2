'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SubnameAccess extends Model {
    static associate(models) {
      // Define associations here, if any
    }
  }

  SubnameAccess.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      listedName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      chainId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      accessToken: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'SubnameAccess',
      tableName: 'SubnameAccess',
    }
  );


  return SubnameAccess;
};
