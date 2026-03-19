import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../../styles/user/Home.css";

export default function Home() {
  const [cars, setCars] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);

      const res = await axios.get("http://localhost:5000/api/cars");
      console.log("Danh sách xe:", res.data);

      setCars(res.data.cars || []);
      setMessage("");
    } catch (error) {
      console.log("Lỗi lấy xe:", error);
      setMessage("Không lấy được danh sách xe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="header-left">
          <a href="#featured">Các mẫu xe</a>
          <a href="#featured">Mua</a>
          <a href="#services">Dịch vụ</a>
          <a href="#featured">Thương hiệu</a>
        </div>

        <div className="header-logo">★</div>

        <div className="header-right">
          <a href="#featured">Tìm kiếm</a>
          <Link to="/login">Đăng nhập</Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-overlay"></div>

        <img
          className="hero-bg"
          src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1600&q=80"
          alt="banner car"
        />

        <div className="hero-content">
          <p className="hero-subtitle">Mẫu xe sang trọng đẳng cấp</p>
          <h1>Mercedes-Benz S-Class</h1>
          <p className="hero-desc">
            Khám phá những mẫu xe nổi bật với thiết kế hiện đại, công nghệ tiên
            tiến và trải nghiệm lái đỉnh cao.
          </p>

          <div className="hero-buttons">
            <a href="#featured" className="btn btn-outline">
              Khám phá ưu đãi
            </a>
            <a href="#featured" className="btn btn-primary">
              Xem xe nổi bật
            </a>
          </div>
        </div>

        <div className="hero-tabs">
          <button className="tab active">Mercedes-Benz</button>
          <button className="tab">AMG</button>
          <button className="tab">MAYBACH</button>
        </div>
      </section>

      <section className="featured-section" id="featured">
        <div className="section-title">
          <p>DANH MỤC NỔI BẬT</p>
          <h2>Xe nổi bật</h2>
        </div>

        <p className="car-count">Hiện có {cars.length} xe đang hiển thị</p>

        {loading && <p className="home-message">Đang tải dữ liệu...</p>}
        {message && <p className="home-message error">{message}</p>}

        {!loading && !message && (
          <div className="car-grid">
            {cars.length > 0 ? (
              cars.map((car, index) => (
                <div className="car-card" key={car._id || index}>
                  <div className="car-images-wrap">
                    <img
                      src={
                        car.images && car.images.length > 0
                          ? car.images[0]
                          : "https://via.placeholder.com/400x250?text=No+Images"
                      }
                      alt={car.name}
                      className="car-images"
                    />
                  </div>

                  <div className="car-info">
                    <h3>{car.name}</h3>

                    <div className="car-meta">
                      <p>
                        <span>Hãng</span>
                        <strong>{car.brand || "Chưa cập nhật"}</strong>
                      </p>
                      <p>
                        <span>Danh mục</span>
                        <strong>{car.category || "Chưa cập nhật"}</strong>
                      </p>
                      <p>
                        <span>Năm</span>
                        <strong>{car.year || "Chưa cập nhật"}</strong>
                      </p>
                    </div>

                    <p className="car-price">
                      {Number(car.price || 0).toLocaleString("vi-VN")}đ
                    </p>

                    <Link to={`/cars/${car._id}`} className="detail-link">
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="home-message">Chưa có xe nào để hiển thị</p>
            )}
          </div>
        )}
      </section>

      <section className="info-banner" id="services">
        <div className="info-box">
          <h3>Đặt lịch lái thử</h3>
          <p>Trải nghiệm thực tế các dòng xe mới nhất ngay hôm nay.</p>
        </div>
        <div className="info-box">
          <h3>Hỗ trợ trả góp</h3>
          <p>Nhiều phương án tài chính linh hoạt, phù hợp với bạn.</p>
        </div>
        <div className="info-box">
          <h3>Dịch vụ bảo dưỡng</h3>
          <p>Chăm sóc xe toàn diện với đội ngũ kỹ thuật chuyên nghiệp.</p>
        </div>
      </section>
    </div>
  );
}