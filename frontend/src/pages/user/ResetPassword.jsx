import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Lock, ArrowRight } from "lucide-react";
import "../../styles/user/Auth.css";
import bgVideo from "../../assets/login-bg.mp4";
import logoWhite from "../../assets/logo-white.png";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("Thiếu token đặt lại mật khẩu");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu nhập lại không khớp");
      return;
    }

    try {
      const res = await axios.post(
        "https://webbanxe-backend-stx9.onrender.com/api/auth/reset-password",
        {
          token,
          newPassword,
        }
      );

      setMessage(res.data.message || "Đặt lại mật khẩu thành công");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.message || "Đặt lại mật khẩu thất bại");
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

          <h1>Đặt lại mật khẩu</h1>
          <p>Tạo mật khẩu mới để tiếp tục truy cập hệ thống mua bán xe cao cấp</p>
        </div>

        <div className="lux-login-card">
          <div className="lux-login-card-head">
            <h2>Mật khẩu mới</h2>
            <p>Nhập và xác nhận mật khẩu mới của bạn</p>
          </div>

          <form className="lux-login-form" onSubmit={handleResetPassword}>
            <div className="lux-login-input">
              <Lock size={18} />
              <input
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="lux-login-input">
              <Lock size={18} />
              <input
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="lux-login-submit">
              <span>Xác nhận</span>
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