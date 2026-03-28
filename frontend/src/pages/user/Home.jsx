import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Heart } from "lucide-react";
import "../../styles/user/Home.css";
import MainNavbar from "../../components/MainNavbar";

export default function Home() {
  const navigate = useNavigate();

  const [cars, setCars] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    fetchCars();
    fetchFavorites();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);

      const res = await axios.get("http://localhost:5000/api/cars");
      setCars(res.data.cars || []);
      setMessage("");
    } catch (error) {
      console.log("Lỗi lấy xe:", error);
      setMessage("Không lấy được danh sách xe");
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setFavoriteIds([]);
        return;
      }

      const res = await axios.get("http://localhost:5000/api/favorites", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const favorites = res.data.favorites || [];
      setFavoriteIds(favorites.map((item) => item._id));
    } catch (error) {
      console.log("Lỗi lấy danh sách yêu thích:", error);
      setFavoriteIds([]);
    }
  };

  const handleToggleFavorite = async (e, carId) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:5000/api/favorites/toggle/${carId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const isFavorite = res.data.isFavorite;

      setFavoriteIds((prev) =>
        isFavorite
          ? [...new Set([...prev, carId])]
          : prev.filter((id) => id !== carId)
      );
    } catch (error) {
      console.log("Lỗi cập nhật yêu thích:", error);
      alert(
        error?.response?.data?.message || "Không cập nhật được mục yêu thích"
      );
    }
  };

  const isFavorite = (carId) => favoriteIds.includes(carId);

  const getCarImage = (car) => {
    if (car.image && car.image.trim() !== "") return car.image;
    if (Array.isArray(car.images) && car.images.length > 0) return car.images[0];
    return "https://via.placeholder.com/400x250?text=No+Images";
  };

  return (
    <div className="home-page">
      <MainNavbar />

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
            <Link to="/cars" className="btn btn-outline">
              Khám phá ưu đãi
            </Link>
            <Link to="/cars" className="btn btn-primary">
              Xem tất cả xe
            </Link>
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
                  <div className="car-images-wrap" style={{ position: "relative" }}>
                    <img
                      src={getCarImage(car)}
                      alt={car.name}
                      className="car-images"
                    />

                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(e, car._id)}
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0, 0, 0, 0.45)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 2,
                      }}
                    >
                      <Heart
                        size={20}
                        color={isFavorite(car._id) ? "#ff4d6d" : "#ffffff"}
                        fill={isFavorite(car._id) ? "#ff4d6d" : "none"}
                      />
                    </button>
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