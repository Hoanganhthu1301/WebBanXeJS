import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { Mail, Lock, ArrowRight } from "lucide-react";
import "../../styles/user/Auth.css";
import bgVideo from "../../assets/login-bg.mp4";
import logoWhite from "../../assets/logo-white.png";

const API_URL = import.meta.env.VITE_API_URL || "https://webbanxe-backend-stx9.onrender.com";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, formData);

      const data = res.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Đăng nhập thất bại");
    }
  };

const handleGoogleSuccess = async (credentialResponse) => {
  try {
    setMessage("");

    console.log("Google credentialResponse:", credentialResponse);
    console.log("Google credential:", credentialResponse?.credential);

    const res = await axios.post(`${API_URL}/api/auth/google-login`, {
      credential: credentialResponse.credential,
    });

    const data = res.data;

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    if (data.user.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  } catch (error) {
    setMessage(error.response?.data?.message || "Đăng nhập Google thất bại");
  }
};  

  const handleGoogleError = () => {
    setMessage("Đăng nhập Google thất bại");
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

          <h1>Đăng nhập</h1>
          <p>Đăng nhập để tiếp tục trải nghiệm hệ thống mua bán xe cao cấp</p>
        </div>

        <div className="lux-login-card">
          <div className="lux-login-card-head">
            <h2>Chào mừng quay lại</h2>
            <p>Nhập thông tin tài khoản để tiếp tục</p>
          </div>

          <form className="lux-login-form" onSubmit={handleLogin}>
            <div className="lux-login-input">
              <Mail size={18} />
              <input
                type="email"
                name="email"
                placeholder="Nhập email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="lux-login-input">
              <Lock size={18} />
              <input
                type="password"
                name="password"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="lux-login-row">
              <label className="lux-login-remember">
                <input type="checkbox" />
                <span>Ghi nhớ đăng nhập</span>
              </label>

              <Link to="/forgot-password" className="lux-login-forgot">
                Quên mật khẩu?
              </Link>
            </div>

            <button type="submit" className="lux-login-submit">
              <span>Đăng nhập</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="lux-login-divider">
            <span>HOẶC</span>
          </div>

          <div className="lux-login-google">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              size="large"
              type="icon"
              shape="circle"
              logo_alignment="center"
            />
          </div>

          {message && <p className="lux-login-message">{message}</p>}

          <div className="lux-login-footer">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
}