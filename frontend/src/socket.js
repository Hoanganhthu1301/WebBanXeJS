import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://webbanxe-backend-stx9.onrender.com");

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  withCredentials: true,
});

export default socket;
