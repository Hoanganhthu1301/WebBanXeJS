import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../../styles/user/Auth.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();

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
        "http://localhost:5000/api/auth/reset-password",
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
    <div className="auth-page">
      <div className="auth-overlay"></div>

      <div className="auth-box">
        <h1>Đặt lại mật khẩu</h1>
        <p>Nhập mật khẩu mới của bạn</p>

        <form className="auth-form" onSubmit={handleResetPassword}>
          <input
            type="password"
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button type="submit">Xác nhận</button>
        </form>

        {message && (
          <p style={{ marginTop: "12px", color: "yellow" }}>{message}</p>
        )}

        <div className="auth-footer">
          <Link to="/login">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}