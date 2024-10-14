// models/payment.js
'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,  // Auto-generate UUID
      primaryKey: true,
    },
    paidBy: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    subnamePurchase: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cryptoPurchase: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {});

  Payment.associate = function (models) {
    // Define any associations here (if necessary)
  };

  return Payment;
};
