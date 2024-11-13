"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Notifications", "read", {
            type: Sequelize.BOOLEAN,
            allowNull: true, // or `false` depending on your requirement
            defaultValue: false // optional, only if you want a default value
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn("Notifications", "read")
    }
}
