"use strict"
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Swaps", "timestamp", {
            type: Sequelize.INTEGER,
            allowNull: true
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn("Swaps", "timestamp")
    }
}
