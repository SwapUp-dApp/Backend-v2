'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.renameColumn(
            "Notifications",
            "reciever_address",
            "receiver_address"
        )
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.renameColumn(
            "Notifications",
            "receiver_address",
            "reciever_address"
        )
    }
}

