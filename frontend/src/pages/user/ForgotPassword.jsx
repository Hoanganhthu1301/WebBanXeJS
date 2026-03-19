import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../../styles/user/Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email }
      );

      setMessage(res.data.message || "Đã gửi email đặt lại mật khẩu");
    } catch (error) {
      setMessage(error.response?.data?.message || "Gửi email thất bại");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-overlay"></div>

      <div className="auth-box">
        <h1>Quên mật khẩu</h1>
        <p>Nhập email để nhận hướng dẫn đặt lại mật khẩu</p>

        <form className="auth-form" onSubmit={handleForgotPassword}>
          <input
            type="email"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button type="submit">Gửi yêu cầu</button>
        </form>

        {message && <p style={{ marginTop: "12px", color: "yellow" }}>{message}</p>}

        <div className="auth-footer">
          <Link to="/login">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}