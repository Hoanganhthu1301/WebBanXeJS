import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/user/Auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage("Mật khẩu nhập lại không khớp");
      return;
    }

    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      };

      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        payload
      );

      setMessage(res.data.message || "Đăng ký thành công");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setMessage(error.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-overlay"></div>

      <div className="auth-box">
        <h1>Đăng ký</h1>
        <p>Tạo tài khoản để bắt đầu mua bán xe</p>

        <form className="auth-form" onSubmit={handleRegister}>
          <input
            type="text"
            name="fullName"
            placeholder="Nhập họ và tên"
            value={formData.fullName}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Nhập email"
            value={formData.email}
            onChange={handleChange}
          />

          <input
            type="text"
            name="phone"
            placeholder="Nhập số điện thoại"
            value={formData.phone}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Nhập mật khẩu"
            value={formData.password}
            onChange={handleChange}
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Nhập lại mật khẩu"
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <button type="submit">Đăng ký</button>
        </form>

        {message && <p style={{ marginTop: "12px", color: "yellow" }}>{message}</p>}

        <div className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}