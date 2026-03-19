import { Link } from "react-router-dom";
import "../../styles/user/Home.css";

export default function Home() {
  const featuredCars = [
    {
      id: 1,
      name: "Mercedes-Benz C-Class",
      price: "1.599.000.000đ",
      image:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 2,
      name: "Mercedes-Benz E-Class",
      price: "2.159.000.000đ",
      image:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 3,
      name: "Mercedes-Benz S-Class",
      price: "4.999.000.000đ",
      image:
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  return (
    <div className="home-page">
      {/* HEADER */}
      <header className="home-header">
        <div className="header-left">
          <a href="#">Các mẫu xe</a>
          <a href="#">Mua</a>
          <a href="#">Dịch vụ</a>
          <a href="#">Thương hiệu</a>
        </div>

        <div className="header-logo">★</div>

        <div className="header-right">
          <a href="#">Tìm kiếm</a>
          <Link to="/login">Đăng nhập</Link>
        </div>
      </header>

      {/* HERO */}
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
            Khám phá dòng xe cao cấp với thiết kế hiện đại, công nghệ tiên tiến
            và trải nghiệm lái đỉnh cao.
          </p>

          <div className="hero-buttons">
            <button className="btn btn-outline">Khám phá ưu đãi</button>
            <button className="btn btn-primary">Tìm hiểu S-Class</button>
          </div>
        </div>

        <div className="hero-tabs">
          <button className="tab active">Mercedes-Benz</button>
          <button className="tab">AMG</button>
          <button className="tab">MAYBACH</button>
        </div>
      </section>

      {/* FEATURED */}
      <section className="featured-section">
        <div className="section-title">
          <p>DANH MỤC NỔI BẬT</p>
          <h2>Xe nổi bật</h2>
        </div>

        <div className="car-grid">
          {featuredCars.map((car) => (
            <div className="car-card" key={car.id}>
              <div className="car-image-wrap">
                <img src={car.image} alt={car.name} className="car-image" />
              </div>
              <div className="car-info">
                <h3>{car.name}</h3>
                <p className="car-price">{car.price}</p>
                <button className="detail-btn">Xem chi tiết</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BANNER INFO */}
      <section className="info-banner">
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