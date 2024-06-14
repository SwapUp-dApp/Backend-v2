'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      wallet: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.createTable("Swaps", {
      id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
      },
      metadata: {
          type: Sequelize.TEXT
      },
      accept_address: { type: Sequelize.STRING },
      init_address: { type: Sequelize.STRING },
      open_trade_id: { type: Sequelize.STRING },
      timestamp: { type: Sequelize.STRING },
      init_sign: { type: Sequelize.STRING },
      accept_sign: { type: Sequelize.STRING },
      tx: { type: Sequelize.STRING, allowNull: true },
      notes: { type: Sequelize.STRING, allowNull: true },
      status: { type: Sequelize.INTEGER },
      offer_type: { type: Sequelize.INTEGER, allowNull: true },
      trade_id: { type: Sequelize.STRING, allowNull: true },
      trading_chain: { type: Sequelize.STRING, allowNull: true },
      swap_mode: { type: Sequelize.STRING, allowNull: true },
      swap_preferences : {type: Sequelize.TEXT},
      createdAt: {
          allowNull: false,
          type: Sequelize.DATE
      },
      updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
      }
  });

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('Users');
    await queryInterface.dropTable('Swaps');
  }
};
