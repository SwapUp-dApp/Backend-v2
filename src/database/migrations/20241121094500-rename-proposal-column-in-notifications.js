'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('Notifications', 'proposal_id', 'open_trade_id');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn('Notifications', 'open_trade_id', 'proposal_id');
  }
};
