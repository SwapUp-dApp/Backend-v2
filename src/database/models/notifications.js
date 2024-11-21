"use strict"
const { Model, DataTypes } = require("sequelize")

module.exports = (sequelize) => {
    class Notifications extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Define any associations here
            // Example: Notifications.belongsTo(models.User);
        }
    }

    Notifications.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4, // Auto-generate UUID
                primaryKey: true
            },
            trade_id: {
                type: DataTypes.STRING,
                allowNull: false
            },
            status: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            receiver_address: {
                type: DataTypes.STRING,
                allowNull: false
            },
            originator_address: {
                type: DataTypes.STRING,
                allowNull: false
            },
            read: {
                type: DataTypes.BOOLEAN,
                allowNull: false
            },
            proposal_id: {
                type: DataTypes.STRING,
                allowNull: true
            },
            swap_mode: {
                type: DataTypes.INTEGER,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: "Notifications"
        }
    )

    return Notifications
}
