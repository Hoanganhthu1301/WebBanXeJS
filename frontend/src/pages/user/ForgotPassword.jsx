import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Mail, ArrowRight } from "lucide-react";
import "../../styles/user/Auth.css";
import bgVideo from "../../assets/login-bg.mp4";
import logoWhite from "../../assets/logo-white.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email.trim()) {
      setMessage("Vui lòng nhập email");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: email.trim(),
      });

      setMessage(res.data.message || "Đã gửi email đặt lại mật khẩu");
    } catch (error) {
      console.error("Forgot password error:", error);
      console.error("Forgot password response:", error.response?.data);

      setMessage(
        error.response?.data?.message || "Gửi email thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lux-login-page">
      <video className="lux-login-video" autoPlay muted loop playsInline>
        <source src={bgVideo} type="video/mp4" />
      </video>

      <div className="lux-login-overlay" />

      <div className="lux-login-layout">
        <div className="lux-login-left">
          <img src={logoWhite} alt="logo" className="lux-login-logo" />
          <h1>Quên mật khẩu</h1>
          <p>Nhập email để nhận hướng dẫn đặt lại mật khẩu</p>
        </div>

        <div className="lux-login-card">
          <div className="lux-login-card-head">
            <h2>Khôi phục tài khoản</h2>
            <p>Chúng tôi sẽ gửi liên kết đặt lại mật khẩu tới email của bạn</p>
          </div>

          <form className="lux-login-form" onSubmit={handleForgotPassword}>
            <div className="lux-login-input">
              <Mail size={18} />
              <input
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              className="lux-login-submit"
              disabled={loading}
            >
              <span>{loading ? "Đang gửi..." : "Gửi yêu cầu"}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {message && <p className="lux-login-message">{message}</p>}

          <div className="lux-login-footer">
            <Link to="/login">Quay lại đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}