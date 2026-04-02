import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/admin/AdminLayout.css";
import NotificationBell from "../../components/NotificationBell";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    cars: 0,
    users: 0,
    orders: 0,
    featuredCars: 0,
  });

  const [recentCars, setRecentCars] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [carsRes, usersRes, depositsRes] = await Promise.all([
        axios.get("https://webbanxe-backend-stx9.onrender.com/api/cars", config),
        axios.get("https://webbanxe-backend-stx9.onrender.com/api/admin/users", config),
        axios.get("https://webbanxe-backend-stx9.onrender.com/api/deposits", config),
      ]);

      const cars =
        carsRes.data?.cars ||
        carsRes.data?.data ||
        (Array.isArray(carsRes.data) ? carsRes.data : []);

      const users =
        usersRes.data?.users ||
        usersRes.data?.data ||
        (Array.isArray(usersRes.data) ? usersRes.data : []);

      const deposits =
        depositsRes.data?.deposits ||
        depositsRes.data?.data ||
        (Array.isArray(depositsRes.data) ? depositsRes.data : []);

      const featuredCars = cars.filter(
        (car) => car.isFeatured === true || car.featured === true
      );

      setStats({
        cars: cars.length,
        users: users.length,
        orders: deposits.length,
        featuredCars: featuredCars.length,
      });

      setRecentCars(cars.slice(0, 5));
    } catch (error) {
      console.error(
        "Lỗi lấy dữ liệu dashboard:",
        error.response?.data || error.message
      );
    }
  };

  const quickActions = [
    {
      title: "Quản lý xe",
      desc: "Thêm, sửa, xóa các mẫu xe trong hệ thống",
      to: "/admin/cars",
    },
    {
      title: "Quản lý người dùng",
      desc: "Xem danh sách người dùng và phân quyền",
      to: "/admin/users",
    },
    {
      title: "Quản lý đơn hàng",
      desc: "Theo dõi yêu cầu mua xe và liên hệ",
      to: "/admin/deposits",
    },
    {
      title: "Quản lý banner",
      desc: "Cập nhật ảnh banner và nội dung trang chủ",
      to: "/admin/banner",
    },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <h2>ADMIN PANEL</h2>
          <p>Quản trị hệ thống</p>
        </div>

        <nav className="admin-menu">
          <Link to="/admin" className="active">
            Tổng quan
          </Link>
          <Link to="/admin/cars">Quản lý xe</Link>
          <Link to="/admin/users">Người dùng</Link>
          <Link to="/admin/deposits">Đơn hàng</Link>
          <Link to="/admin/categories">Danh mục</Link>
          <Link to="/admin/brands">Hãng xe</Link>
          <Link to="/admin/showrooms">Showroom</Link>
          <Link to="/admin/contacts">Yêu cầu tư vấn</Link>
          <Link to="/admin/revenue">Báo cáo doanh thu</Link>
          <Link to="/admin/promotions">Khuyến mãi</Link>
        </nav>
      </aside>

      <main className="admin-content">
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <h1>Trang chủ Admin</h1>
            <p>Chào mừng Admin quay lại hệ thống</p>
          </div>

          <div
            className="admin-topbar-right"
            style={{ display: "flex", alignItems: "center", gap: "12px" }}
          >
            <NotificationBell dark={false} />
            <button className="admin-logout-btn" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="admin-grid-4">
          <div className="admin-stat-card">
            <h3>{stats.cars}</h3>
            <p>Tổng số xe</p>
          </div>

          <div className="admin-stat-card">
            <h3>{stats.users}</h3>
            <p>Người dùng</p>
          </div>

          <div className="admin-stat-card">
            <h3>{stats.orders}</h3>
            <p>Đơn hàng</p>
          </div>

          <div className="admin-stat-card">
            <h3>{stats.featuredCars}</h3>
            <p>Xe nổi bật</p>
          </div>
        </div>

        <section className="admin-section">
          <h2>Quản lý nhanh</h2>
          <div className="admin-quick-grid">
            {quickActions.map((item) => (
              <Link key={item.title} to={item.to} className="admin-quick-card">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="admin-section">
          <h2>Xe mới thêm</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên xe</th>
                  <th>Giá</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentCars.map((car, index) => (
                  <tr key={car._id || index}>
                    <td>{car._id ? car._id.slice(-5) : index + 1}</td>
                    <td>{car.name}</td>
                    <td>{car.price?.toLocaleString("vi-VN")}đ</td>
                    <td>{car.status || "Đang bán"}</td>
                  </tr>
                ))}

                {recentCars.length === 0 && (
                  <tr>
                    <td colSpan="4">Chưa có dữ liệu xe</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}