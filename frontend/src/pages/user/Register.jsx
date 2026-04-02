import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { User, Mail, Phone, Lock, ArrowRight } from "lucide-react";
import "../../styles/user/Auth.css";
import bgVideo from "../../assets/login-bg.mp4";
import logoWhite from "../../assets/logo-white.png";
import { useTranslation } from 'react-i18next';

export default function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (formData.password !== formData.confirmPassword) {
      setMessage(t('err_password_mismatch'));
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
        "https://webbanxe-backend-stx9.onrender.com/api/auth/register",
        payload
      );

      setMessage(res.data.message || t('msg_register_success'));

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setMessage(error.response?.data?.message || t('msg_register_failed'));
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
          <h1>{t('register_title')}</h1>
          <p>{t('register_desc')}</p>
        </div>

        <div className="lux-login-card">
          <div className="lux-login-card-head">
            <h2>{t('register_card_title')}</h2>
            <p>{t('register_card_desc')}</p>
          </div>

          <form className="lux-login-form" onSubmit={handleRegister}>
            <div className="lux-login-input">
              <User size={18} />
              <input
                type="text"
                name="fullName"
                placeholder={t('ph_fullname')}
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            <div className="lux-login-input">
              <Mail size={18} />
              <input
                type="email"
                name="email"
                placeholder={t('ph_email')}
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="lux-login-input">
              <Phone size={18} />
              <input
                type="text"
                name="phone"
                placeholder={t('ph_phone')}
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="lux-login-input">
              <Lock size={18} />
              <input
                type="password"
                name="password"
                placeholder={t('ph_password')}
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="lux-login-input">
              <Lock size={18} />
              <input
                type="password"
                name="confirmPassword"
                placeholder={t('ph_confirm_password')}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="lux-login-submit">
              <span>{t('btn_register')}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {message && <p className="lux-login-message">{message}</p>}

          <div className="lux-login-footer">
            {t('have_account')} <Link to="/login">{t('btn_login')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}