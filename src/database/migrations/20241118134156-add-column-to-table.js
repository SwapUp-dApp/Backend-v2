"use strict"

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn("Notifications", "proposal_id", {
            type: Sequelize.STRING,
            allowNull: true
        })
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn("Notifications", "proposal_id")
    }
}
