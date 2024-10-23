'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'smartAccount', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'privateKey', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'smartAccount');
    await queryInterface.removeColumn('Users', 'privateKey');
  }
};
