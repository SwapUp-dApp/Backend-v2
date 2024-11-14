'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Notifications", {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4, // Auto-generate UUID
                primaryKey: true,
                allowNull: false
            },
            trade_id: {
                type: Sequelize.STRING,
                allowNull: false
            },
            status: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            receiver_address: {
                type: Sequelize.STRING,
                allowNull: false
            },
            originator_address: {
                type: Sequelize.STRING,
                allowNull: false
            },
            read: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("GETDATE")
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("GETDATE")
            }
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("Notifications")
    }
}