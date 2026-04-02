import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Globe,
  User,
  LogOut,
  Menu,
  Heart,
  Scale,
  MapPin,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import NotificationBell from "./NotificationBell";
import "./MainNavbar.css";
import logo from "../assets/logo-white.png";

export default function MainNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const currentLang = i18n.language || "vi";
    i18n.changeLanguage(currentLang.startsWith("vi") ? "en" : "vi");
  };

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  const handleGoToShowrooms = () => {
    navigate("/showrooms");
    setMobileOpen(false);
  };

  return (
    <header className="lux-navbar">
      <div className="lux-navbar-inner">
        <div className="lux-navbar-left">
          <Link to="/" className="lux-brand">
            {t("web_title")}
          </Link>

          <nav className="lux-nav-text">
            <Link to="/cars" className="lux-nav-link">
              {t("nav_cars")}
            </Link>

            <Link
              to={user ? "/my-deposits" : "/login"}
              className="lux-nav-link"
            >
              {t("nav_orders")}
            </Link>

            <Link
              to={user ? "/consultations" : "/login"}
              className="lux-nav-link"
            >
              {t("nav_consult")}
            </Link>
          </nav>
        </div>

        <div className="lux-navbar-center">
          <Link to="/" className="lux-logo-link">
            <img src={logo} alt="Logo" className="lux-logo-img" />
          </Link>
        </div>

        <div className="lux-navbar-right">
          <button
            type="button"
            className="lux-icon-btn"
            title="Vị trí showroom"
            onClick={handleGoToShowrooms}
          >
            <MapPin size={18} />
          </button>

          <Link
            to={user ? "/favorites" : "/login"}
            className="lux-icon-btn"
            title={t("title_favorites")}
          >
            <Heart size={18} />
          </Link>

          <Link to="/compare" className="lux-icon-btn" title="So sánh xe">
            <Scale size={18} />
          </Link>

          <button
            type="button"
            className="lux-icon-btn lux-lang-btn"
            title={t("title_language")}
            onClick={toggleLanguage}
          >
            <Globe size={18} />
            <span className="lang-code">
              {(i18n.language || "vi").startsWith("vi") ? "VI" : "EN"}
            </span>
          </button>

          {user && <NotificationBell dark />}

          {!user ? (
            <Link to="/login" className="lux-user-link">
              <User size={18} />
              <span>{t("btn_login")}</span>
            </Link>
          ) : (
            <>
              <button
                type="button"
                className="lux-user-link"
                onClick={() =>
                  navigate(
                    user.role === "admin" ? "/admin/deposits" : "/my-deposits"
                  )
                }
                title={user.fullName || user.name}
              >
                <User size={18} />
                <span>{user.fullName || user.name || t("user_default")}</span>
              </button>

              <button
                type="button"
                className="lux-icon-btn lux-logout-btn"
                onClick={handleLogout}
                title={t("btn_logout")}
              >
                <LogOut size={18} />
              </button>
            </>
          )}

          <button
            type="button"
            className="lux-icon-btn lux-menu-btn"
            title={t("title_menu")}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lux-mobile-menu">
          <Link to="/" onClick={() => setMobileOpen(false)}>
            {t("web_title")}
          </Link>

          <Link to="/cars" onClick={() => setMobileOpen(false)}>
            {t("nav_cars")}
          </Link>

          <button
            type="button"
            className="lux-mobile-action"
            onClick={handleGoToShowrooms}
          >
            Showrooms
          </button>

          <Link to="/compare" onClick={() => setMobileOpen(false)}>
            So sánh xe
          </Link>

          <Link
            to={user ? "/my-deposits" : "/login"}
            onClick={() => setMobileOpen(false)}
          >
            {t("nav_orders")}
          </Link>

          <Link
            to={user ? "/consultations" : "/login"}
            onClick={() => setMobileOpen(false)}
          >
            {t("nav_consult")}
          </Link>

          <Link
            to={user ? "/favorites" : "/login"}
            onClick={() => setMobileOpen(false)}
          >
            {t("nav_favorites")}
          </Link>
        </div>
      )}
    </header>
  );
}