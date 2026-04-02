import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  Search,
  Globe,
  User,
  LogOut,
  Menu,
  Heart,
  Scale,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import "./MainNavbar.css";

export default function MainNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [keyword, setKeyword] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const handleSearch = (e) => {
    e.preventDefault();
    const value = keyword.trim();
    navigate(value ? `/cars?keyword=${encodeURIComponent(value)}` : "/cars");
    setMobileOpen(false);
  };

  return (
    <header className="lux-navbar">
      <div className="lux-navbar-inner">
        <div className="lux-navbar-left">
          <Link to="/" className="lux-brand">
            WEB BÁN XE
          </Link>

          <nav className="lux-nav-text">
            <Link to="/cars" className="lux-nav-link">
              Các mẫu xe
            </Link>

            <Link to="/showrooms" className="lux-nav-link">
              Showrooms
            </Link>

            <Link
              to={user ? "/my-deposits" : "/login"}
              className="lux-nav-link"
            >
              Đơn hàng
            </Link>

            <Link
              to={user ? "/consultations" : "/login"}
              className="lux-nav-link"
            >
              Tư vấn
            </Link>
          </nav>
        </div>

        <div className="lux-navbar-right">
          <form className="lux-search-form" onSubmit={handleSearch}>
            <button type="submit" className="lux-icon-btn" title="Tìm kiếm">
              <Search size={18} />
            </button>
            <input
              type="text"
              placeholder="Tìm xe..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </form>

          <Link
            to={user ? "/favorites" : "/login"}
            className="lux-icon-btn"
            title="Yêu thích"
          >
            <Heart size={18} />
          </Link>

          <Link to="/compare" className="nav-icon-btn" title="So sánh xe">
            <Scale size={20} />
          </Link>

          <button type="button" className="lux-icon-btn" title="Ngôn ngữ">
            <Globe size={18} />
          </button>

          {user && <NotificationBell dark />}

          {!user ? (
            <Link to="/login" className="lux-user-link">
              <User size={18} />
              <span>Đăng nhập</span>
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
                <span>{user.fullName || user.name || "Người dùng"}</span>
              </button>

              <button
                type="button"
                className="lux-icon-btn lux-logout-btn"
                onClick={handleLogout}
                title="Đăng xuất"
              >
                <LogOut size={18} />
              </button>
            </>
          )}

          <button
            type="button"
            className="lux-icon-btn lux-menu-btn"
            title="Menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lux-mobile-menu">
          <Link to="/cars" onClick={() => setMobileOpen(false)}>
            Các mẫu xe
          </Link>

          <Link to="/showrooms" onClick={() => setMobileOpen(false)}>
            Showrooms
          </Link>

          <Link
            to={user ? "/my-deposits" : "/login"}
            onClick={() => setMobileOpen(false)}
          >
            Đơn hàng
          </Link>

          <Link
            to={user ? "/consultations" : "/login"}
            onClick={() => setMobileOpen(false)}
          >
            Tư vấn
          </Link>

          <Link
            to={user ? "/favorites" : "/login"}
            onClick={() => setMobileOpen(false)}
          >
            Yêu thích
          </Link>
        </div>
      )}
    </header>
  );
}