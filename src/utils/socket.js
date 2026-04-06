let ioInstance = null;

const initSocket = (server) => {
  const { Server } = require("socket.io");

  ioInstance = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://webbanxe.store",
        "https://www.webbanxe.store",
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  ioInstance.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    socket.on("register", ({ userId, role }) => {
      if (!userId) return;

      socket.join(`user_${String(userId)}`);

      if (String(role).toLowerCase() === "admin") {
        socket.join("admins");
      }

      console.log(`✅ Registered socket user=${userId} role=${role}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return ioInstance;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io chưa được khởi tạo");
  }
  return ioInstance;
};

module.exports = {
  initSocket,
  getIO,
};