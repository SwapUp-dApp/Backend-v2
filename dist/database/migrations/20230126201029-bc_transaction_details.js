'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('Swaps',
      // table name
      'tx',
      // new field name
      {
        type: Sequelize.STRING,
        allowNull: true
      }, {
        transaction
      });
      await queryInterface.addColumn('Swaps',
      // table name
      'notes',
      // new field name
      {
        type: Sequelize.STRING,
        allowNull: true
      }, {
        transaction
      });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('Swaps', 'tx', {
        transaction
      });
      await queryInterface.removeColumn('Swaps', 'notes', {
        transaction
      });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
//# sourceMappingURL=20230126201029-bc_transaction_details.js.map