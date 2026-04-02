const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

router.get("/", verifyToken, notificationController.getMyNotifications);
router.put("/read-all", verifyToken, notificationController.markAllAsRead);
router.put("/:id/read", verifyToken, notificationController.markAsRead);

module.exports = router;