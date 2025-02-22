'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Subnames extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }

  Subnames.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      subnameOwner: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      subnameLabel: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      subname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      parentName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Subnames',
      tableName: 'Subnames',
    }
  );

  return Subnames;
};
