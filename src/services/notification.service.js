const Notification = require("../models/notification.model");
const User = require("../models/user.model");
const { getIO } = require("../utils/socket");

const safeEmitToUserRoom = (userId, payload) => {
  try {
    const io = getIO();
    io.to(`user_${String(userId)}`).emit("notification:new", payload);
  } catch (error) {
    console.error("safeEmitToUserRoom error:", error.message);
  }
};

const createNotification = async ({
  recipientId,
  recipientRole,
  type,
  title,
  message,
  link = "",
  data = {},
}) => {
  if (!recipientId) return null;

  const notification = await Notification.create({
    recipientId,
    recipientRole,
    type,
    title,
    message,
    link,
    data,
  });

  safeEmitToUserRoom(recipientId, { notification });

  return notification;
};

const notifyUser = async ({
  userId,
  type,
  title,
  message,
  link = "",
  data = {},
}) => {
  if (!userId) return null;

  return createNotification({
    recipientId: userId,
    recipientRole: "user",
    type,
    title,
    message,
    link,
    data,
  });
};

const notifyAllAdmins = async ({
  type,
  title,
  message,
  link = "",
  data = {},
}) => {
  const admins = await User.find({
    role: { $in: ["admin", "ADMIN"] },
  }).select("_id");

  if (!admins.length) return [];

  const docs = admins.map((admin) => ({
    recipientId: admin._id,
    recipientRole: "admin",
    type,
    title,
    message,
    link,
    data,
  }));

  const notifications = await Notification.insertMany(docs);

  notifications.forEach((item) => {
    safeEmitToUserRoom(item.recipientId, { notification: item });
  });

  return notifications;
};

module.exports = {
  createNotification,
  notifyUser,
  notifyAllAdmins,
};