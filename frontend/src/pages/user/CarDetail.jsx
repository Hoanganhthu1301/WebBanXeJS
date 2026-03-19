import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "../../styles/user/CarDetail.css";

export default function CarDetail() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [message, setMessage] = useState("");
  const [activeFeature, setActiveFeature] = useState(null);

  useEffect(() => {
    fetchCar();
  }, [id]);

  const fetchCar = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/cars/${id}`);
      setCar(res.data.car);
    } catch (error) {
      setMessage("Không lấy được chi tiết xe");
    }
  };

  const carImages = useMemo(() => {
    if (!car) return [];

    const list = [];

    if (car.image && car.image.trim() !== "") {
      list.push(car.image);
    }

    if (Array.isArray(car.images)) {
      car.images.forEach((img) => {
        if (
          img &&
          typeof img === "string" &&
          img.trim() !== "" &&
          !list.includes(img)
        ) {
          list.push(img);
        }
      });
    }

    if (list.length === 0) {
      list.push("https://via.placeholder.com/1600x900?text=No+Image");
    }

    return list;
  }, [car]);

  const getImage = (index) => carImages[index] || carImages[0];

  if (message) {
    return <p style={{ padding: "30px", color: "red" }}>{message}</p>;
  }

  if (!car) {
    return <p style={{ padding: "30px" }}>Đang tải dữ liệu...</p>;
  }

  const highlights =
    car.highlights && car.highlights.length > 0
      ? car.highlights
      : [
          {
            title: "Ngoại thất hiện đại",
            text: "Thiết kế sang trọng, mạnh mẽ và đậm chất cao cấp.",
            image: getImage(0),
          },
          {
            title: "Khoang lái cao cấp",
            text: "Nội thất tinh tế, tập trung vào trải nghiệm người lái.",
            image: getImage(1),
          },
          {
            title: "Vận hành mượt mà",
            text: "Khả năng vận hành ổn định, phù hợp đi phố và đường dài.",
            image: getImage(2),
          },
        ];

  const features =
    car.features && car.features.length > 0
      ? car.features.map((item, index) => ({
          ...item,
          image: item.image || getImage(index),
        }))
      : [
          {
            title: "Màn hình giải trí",
            text: "Hiển thị thông tin trực quan, dễ sử dụng.",
            image: getImage(0),
          },
          {
            title: "Hỗ trợ lái",
            text: "Tăng độ an toàn và sự tự tin khi vận hành.",
            image: getImage(1),
          },
          {
            title: "Khung gầm",
            text: "Cân bằng tốt giữa độ êm ái và cảm giác lái.",
            image: getImage(2),
          },
          {
            title: "Tiện nghi nội thất",
            text: "Thiết kế hướng tới sự thoải mái và sang trọng.",
            image: getImage(0),
          },
        ];

  return (
    <div className="mb-detail-page">
      <section className="mb-hero">
        <img
          src={getImage(0)}
          alt={car.name}
          className="mb-hero-bg"
          onError={(e) => {
            e.target.src =
              "https://via.placeholder.com/1600x900?text=Image+Error";
          }}
        />
        <div className="mb-hero-overlay"></div>

        <div className="mb-hero-content">
          <Link to="/" className="mb-back-link">
            ← Quay lại
          </Link>

          <p className="mb-label">{car.brand}</p>
          <h1>{car.name}</h1>
          <p className="mb-price">
            Giá từ {Number(car.price).toLocaleString("vi-VN")}đ
          </p>

          {car.overviewTitle && (
            <h3 className="mb-overview-title">{car.overviewTitle}</h3>
          )}
          {car.overviewText && (
            <p className="mb-overview-text">{car.overviewText}</p>
          )}

          <div className="mb-hero-actions">
            <a href="#contact" className="mb-btn mb-btn-light">
              Yêu cầu tư vấn
            </a>
            <a href="#specs" className="mb-btn mb-btn-dark">
              Xem thông số
            </a>
          </div>
        </div>
      </section>

      <nav className="mb-sticky-nav">
        <a href="#highlights">Nổi bật</a>
        <a href="#features">Trang bị</a>
        <a href="#specs">Thông số</a>
        <a href="#contact">Tư vấn</a>
      </nav>

      <section id="highlights" className="mb-section">
        <div className="mb-section-heading">
          <p>NỔI BẬT</p>
          <h2>Những điểm nổi bật của {car.name}</h2>
        </div>

        <div className="mb-highlight-grid">
          {highlights.map((item, index) => (
            <div className="mb-highlight-card" key={index}>
              <img
                src={item.image || getImage(index)}
                alt={item.title}
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/600x400?text=Image+Error";
                }}
              />
              <div className="mb-highlight-text">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mb-section">
        <div className="mb-section-heading">
          <p>TRANG BỊ</p>
          <h2>Các trang bị nổi bật</h2>
        </div>

        <div className="mb-feature-grid">
          {features.map((item, index) => (
            <button
              type="button"
              className="mb-feature-card"
              key={index}
              onClick={() => setActiveFeature(item)}
            >
              <img
                src={item.image}
                alt={item.title}
                className="mb-feature-card-image"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/500x320?text=Image+Error";
                }}
              />
              <div className="mb-feature-card-content">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section id="specs" className="mb-section">
        <div className="mb-section-heading">
          <p>THÔNG SỐ KỸ THUẬT</p>
          <h2>Thông tin chi tiết</h2>
        </div>

        <div className="mb-specs-card">
          <div><span>Hãng</span><strong>{car.brand}</strong></div>
          <div><span>Danh mục</span><strong>{car.category}</strong></div>
          <div><span>Năm sản xuất</span><strong>{car.year}</strong></div>
          <div><span>Nhiên liệu</span><strong>{car.fuel}</strong></div>
          <div><span>Hộp số</span><strong>{car.transmission}</strong></div>
          <div><span>Số km đã đi</span><strong>{car.mileage}</strong></div>
          <div><span>Màu xe</span><strong>{car.color}</strong></div>
          <div>
            <span>Trạng thái</span>
            <strong>{car.status === "available" ? "Đang bán" : "Ẩn"}</strong>
          </div>
        </div>

        <div className="mb-description-box">
          <h3>Mô tả</h3>
          <p>{car.description || "Chưa có mô tả cho xe này."}</p>
        </div>
      </section>

      <section id="contact" className="mb-section">
        <div className="mb-section-heading">
          <p>YÊU CẦU TƯ VẤN</p>
          <h2>Đăng ký nhận tư vấn về {car.name}</h2>
        </div>

        <form className="mb-contact-form">
          <input type="text" placeholder="Họ và tên" />
          <input type="text" placeholder="Số điện thoại" />
          <input type="email" placeholder="Email" />
          <textarea rows="5" placeholder="Nội dung cần tư vấn"></textarea>
          <button type="submit">Gửi yêu cầu</button>
        </form>
      </section>

      {activeFeature && (
        <div className="mb-feature-drawer-overlay" onClick={() => setActiveFeature(null)}>
          <div
            className="mb-feature-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-feature-drawer-header">
              <h3>Trang bị</h3>
              <button onClick={() => setActiveFeature(null)}>×</button>
            </div>

            <img
              src={activeFeature.image}
              alt={activeFeature.title}
              className="mb-feature-drawer-image"
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/700x500?text=Image+Error";
              }}
            />

            <div className="mb-feature-drawer-body">
              <h2>{activeFeature.title}</h2>
              <p>{activeFeature.text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}