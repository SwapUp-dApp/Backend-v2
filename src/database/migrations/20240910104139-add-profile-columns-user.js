'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('Users', "title", {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Users', "description", {
      type: Sequelize.TEXT
    });

    await queryInterface.addColumn('Users', "social_links", {
      type: Sequelize.TEXT
    });

    await queryInterface.addColumn('Users', "images", {
      type: Sequelize.TEXT
    });

    await queryInterface.addColumn('Users', "points", {
      type: Sequelize.INTEGER
    });

    await queryInterface.addColumn('Users', "tags", {
      type: Sequelize.TEXT
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('Users', {
      title
    });

    await queryInterface.removeColumn('Users', {
      description
    });

    await queryInterface.removeColumn('Users', {
      social_links
    });

    await queryInterface.removeColumn('Users', {
      images
    });

    await queryInterface.removeColumn('Users', {
      points
    });

    await queryInterface.removeColumn('Users', {
      tags
    });
  }
};
