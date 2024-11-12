import db from "../../database/models"
const { Op } = require("sequelize")
import { handleError } from "../../errors"

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params
        const response = await db.notifications.update(
            { read: true },
            { where: { id } }
        )
        if (response) {
            res.json({
                success: true,
                message: "mark_as_read",
                data: response
            })
        }
    } catch (err) {
        handleError(res, err, "mark_as_read error")
    }
}

const checkNewNotifications = async (req, res) => {
    try {
        const response = await db.notifications.findAll({
            where: {
                createdAt: {
                    [Op.gt]: req.query.timestamp
                },
                receiver_address: req.query.receiver_address
            },
            order: [["createdAt", "DESC"]]
        })
        res.json({
            success: true,
            message: "check_new_notifications",
            data: response
        })
    } catch (err) {
        handleError(res, err, "check_new_notifications error")
    }
}

const fetchOlderNotifications = async (req, res) => {
    const pageSize = 10
    try {
        const offset = (req.query.page - 1) * pageSize // Calculate the offset for pagination
        const response = await db.notifications.findAll({
            where: {
                receiver_address: req.query.receiver_address
            },
            order: [["createdAt", "DESC"]],
            limit: pageSize,
            offset: offset
        })
        res.json({
            success: true,
            message: "fetch_older_notifications",
            data: response
        })
    } catch (err) {
        handleError(res, err, "fetch_older_notifications error")
    }
}

const deleteNotification = async (req, res) => {
    try {
        const response = await db.notifications.destroy({
            where: { id: req.params.id }
        })
        res.json({
            success: true,
            message: "delete_notification",
            data: response
        })
    } catch (err) {
        handleError(res, err, "delete_notification error")
    }
}

const deleteAllNotifications = async (req, res) => {
    try {
        const response = await db.notifications.destroy({
            where: { receiver_address: req.params.address }
        })
        res.json({
            success: true,
            message: "delete_all_notifications",
            data: response
        })
    } catch (err) {
        handleError(res, err, "delete_all_notifications error")
    }
}

export const notificationController = {
    markAsRead,
    checkNewNotifications,
    fetchOlderNotifications,
    deleteNotification,
    deleteAllNotifications
}
