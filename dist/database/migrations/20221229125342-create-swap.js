"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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
      accept_address: {
        type: Sequelize.STRING
      },
      init_address: {
        type: Sequelize.STRING
      },
      timestamp: {
        type: Sequelize.STRING
      },
      init_sign: {
        type: Sequelize.STRING
      },
      accept_sign: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.INTEGER
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Swaps");
  }
};
//# sourceMappingURL=20221229125342-create-swap.js.map