import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "../../styles/admin/AdminHome.css";

export default function AdminHome() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const recentCars = [
    {
      id: 1,
      name: "Mercedes C-Class",
      price: "1.599.000.000đ",
      status: "Đang bán",
    },
    {
      id: 2,
      name: "BMW 320i",
      price: "1.435.000.000đ",
      status: "Đang bán",
    },
    {
      id: 3,
      name: "Audi A6",
      price: "2.100.000.000đ",
      status: "Ẩn",
    },
  ];

  if (!user || user.role !== "admin") return null;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">ADMIN PANEL</div>

        <nav className="admin-menu">
          <Link to="/admin" className="active">Tổng quan</Link>
          <Link to="/admin/cars">Quản lý xe</Link>
          <Link to="/admin/users">Người dùng</Link>
          <Link to="/admin/orders">Đơn hàng</Link>
          <Link to="/admin/categories">Danh mục</Link>
          <Link to="/admin/banners">Banner</Link>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>Trang chủ Admin</h1>
            <p>Chào mừng {user?.fullName || "Admin"} quay lại hệ thống</p>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Đăng xuất
          </button>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <h3>128</h3>
            <p>Tổng số xe</p>
          </div>

          <div className="stat-card">
            <h3>46</h3>
            <p>Người dùng</p>
          </div>

          <div className="stat-card">
            <h3>18</h3>
            <p>Đơn hàng</p>
          </div>

          <div className="stat-card">
            <h3>12</h3>
            <p>Xe nổi bật</p>
          </div>
        </section>

        <section className="quick-actions">
          <h2>Quản lý nhanh</h2>

          <div className="action-grid">
            <Link to="/admin/cars" className="action-card">
              <h3>Quản lý xe</h3>
              <p>Thêm, sửa, xóa các mẫu xe trong hệ thống</p>
            </Link>

            <Link to="/admin/users" className="action-card">
              <h3>Quản lý người dùng</h3>
              <p>Xem danh sách người dùng và phân quyền</p>
            </Link>

            <Link to="/admin/orders" className="action-card">
              <h3>Quản lý đơn hàng</h3>
              <p>Theo dõi các yêu cầu mua xe và liên hệ</p>
            </Link>

            <Link to="/admin/banners" className="action-card">
              <h3>Quản lý banner</h3>
              <p>Cập nhật ảnh banner và nội dung trang chủ</p>
            </Link>
          </div>
        </section>

        <section className="recent-section">
          <h2>Xe mới thêm</h2>

          <div className="table-wrapper">
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
                {recentCars.map((car) => (
                  <tr key={car.id}>
                    <td>{car.id}</td>
                    <td>{car.name}</td>
                    <td>{car.price}</td>
                    <td>
                      <span
                        className={
                          car.status === "Đang bán"
                            ? "status selling"
                            : "status hidden"
                        }
                      >
                        {car.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}