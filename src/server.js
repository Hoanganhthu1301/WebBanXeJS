require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./utils/socket");

const PORT = process.env.PORT || 5000;

console.log("JWT?", !!process.env.JWT_SECRET);
console.log("GEMINI?", !!process.env.GEMINI_API_KEY);
console.log("RESEND?", !!process.env.RESEND_API_KEY);

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Start server failed:", error);
    process.exit(1);
  }
};

startServer();