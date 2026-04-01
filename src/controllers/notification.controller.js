const Notification = require("../models/notification.model");

const getUserId = (req) => req?.user?._id || req?.user?.id || null;

const getMyNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);

    const notifications = await Notification.find({
      recipientId: userId,
    })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipientId: userId,
      isRead: false,
    });

    return res.status(200).json({
      message: "Lấy thông báo thành công",
      notifications,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy thông báo",
      error: error.message,
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipientId: userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return res.status(200).json({
      message: "Đã đánh dấu đã đọc",
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi cập nhật thông báo",
      error: error.message,
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = getUserId(req);

    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      message: "Đã đánh dấu tất cả là đã đọc",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi cập nhật tất cả thông báo",
      error: error.message,
    });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};