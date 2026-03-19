import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/user/Auth.css";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData
      );

      const data = res.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage("Đăng nhập thành công");

      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-overlay"></div>

      <div className="auth-box">
        <h1>Đăng nhập</h1>
        <p>Chào mừng bạn quay lại hệ thống mua bán xe</p>

        <form className="auth-form" onSubmit={handleLogin}>
          <input
            type="email"
            name="email"
            placeholder="Nhập email"
            value={formData.email}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Nhập mật khẩu"
            value={formData.password}
            onChange={handleChange}
          />

          <div className="auth-links-row">
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>

          <button type="submit">Đăng nhập</button>
        </form>

        {message && <p style={{ marginTop: "12px", color: "yellow" }}>{message}</p>}

        <div className="auth-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
}