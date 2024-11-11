import express from "express"
import { notificationController } from '../controllers/notificationController.js'

export const notificationRouter = express.Router()

notificationRouter.patch("/:id", notificationController.markAsRead)
notificationRouter.get("/", notificationController.checkNewNotifications)
notificationRouter.get("/older", notificationController.fetchOlderNotifications)
