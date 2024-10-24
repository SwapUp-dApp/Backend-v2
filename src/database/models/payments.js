"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define any associations here
      // Example: Payment.belongsTo(models.User);
    }
  }

  Payment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,  // Auto-generate UUID
        primaryKey: true,
      },
      paidBy: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      subnamePurchase: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cryptoPurchase: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      subscriptionPurchase: {
        type: DataTypes.TEXT,
        allowNull: true,
      }
    },
    {
      sequelize,
      modelName: "Payment",
    }
  );

  return Payment;
};
