import { useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import "../styles/user/ChatbotWidget.css";

const API_URL = import.meta.env.VITE_API_URL || "https://webbanxe-backend-stx9.onrender.com";

export default function ChatbotWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Xin chào, tôi là trợ lý AI. Tôi có thể hỗ trợ bạn về xe, showroom, khuyến mãi và đặt cọc.",
    },
  ]);

  const getCurrentCarId = () => {
    const parts = location.pathname.split("/");
    if (parts[1] === "cars" && parts[2]) return parts[2];
    return null;
  };

  const getLocationIfAvailable = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);

      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      const userLocation = await getLocationIfAvailable();
      const carId = getCurrentCarId();

      const res = await axios.post(`${API_URL}/api/chatbot`, {
        message: userText,
        carId,
        userLocation,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: res.data.answer || "Tôi chưa có câu trả lời phù hợp.",
        },
      ]);
    } catch (error) {
      console.error("Lỗi chatbot:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Xin lỗi, chatbot đang bận. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-widget">
      {!open ? (
        <button className="chatbot-toggle" onClick={() => setOpen(true)}>
          AI Chat
        </button>
      ) : (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div>
              <strong>Trợ lý AI</strong>
              <p>Hỗ trợ xe · showroom · khuyến mãi</p>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chatbot-message ${
                  msg.role === "user" ? "user" : "bot"
                }`}
              >
                <div className="chatbot-bubble">{msg.text}</div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-message bot">
                <div className="chatbot-bubble">AI đang trả lời...</div>
              </div>
            )}
          </div>

          <div className="chatbot-input-row">
            <input
              type="text"
              placeholder="Nhập câu hỏi..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend}>Gửi</button>
          </div>
        </div>
      )}
    </div>
  );
}