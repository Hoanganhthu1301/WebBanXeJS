import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/user/CarDetail.css";
import MainNavbar from "../../components/MainNavbar";

export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [car, setCar] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [message, setMessage] = useState("");
  const [activeFeature, setActiveFeature] = useState(null);
  const [user, setUser] = useState(null);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  useEffect(() => {
    fetchCar();

    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
  }, [id]);

  useEffect(() => {
    setCurrentPromoIndex(0);
  }, [id, promotions.length]);

  const fetchCar = async () => {
    try {
      const [carRes, promoRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/cars/${id}`),
        axios.get(`http://localhost:5000/api/promotions/car/${id}`),
      ]);

      setCar(carRes.data.car || null);
      setPromotions(promoRes.data.promotions || []);
      setMessage("");
    } catch (error) {
      console.log("Lỗi fetch car detail:", error);
      setMessage("Không lấy được chi tiết xe");
    }
  };

  const formatPrice = (value) => {
    return Number(value || 0).toLocaleString("vi-VN") + "đ";
  };

  const calculatePricingByPromotion = (carPrice, promotion) => {
    const originalPrice = Number(carPrice || 0);

    if (!promotion) {
      return {
        originalPrice,
        discountAmount: 0,
        finalPrice: originalPrice,
      };
    }

    let discountAmount = 0;

    if (promotion.type === "amount") {
      discountAmount = Number(promotion.value || 0);
    } else if (promotion.type === "percent") {
      discountAmount = Math.round(
        originalPrice * (Number(promotion.value || 0) / 100)
      );
    }

    if (discountAmount > originalPrice) {
      discountAmount = originalPrice;
    }

    return {
      originalPrice,
      discountAmount,
      finalPrice: Math.max(0, originalPrice - discountAmount),
    };
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

  const handleConsultationClick = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Vui lòng đăng nhập để gửi yêu cầu tư vấn");
      navigate("/login");
      return;
    }

    navigate(`/cars/${car._id}/contact`);
  };

  const handleDepositClick = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Vui lòng đăng nhập để đặt cọc giữ xe");
      navigate("/login");
      return;
    }

    navigate(`/cars/${car._id}/deposit`);
  };

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
      ? car.features
      : [
          {
            title: "Màn hình giải trí",
            text: "Hiển thị thông tin trực quan, dễ sử dụng.",
            image: "",
          },
          {
            title: "Hỗ trợ lái",
            text: "Tăng độ an toàn và sự tự tin khi vận hành.",
            image: "",
          },
          {
            title: "Khung gầm",
            text: "Cân bằng tốt giữa độ êm ái và cảm giác lái.",
            image: "",
          },
          {
            title: "Tiện nghi nội thất",
            text: "Thiết kế hướng tới sự thoải mái và sang trọng.",
            image: "",
          },
        ];

  const selectedPromotion =
    promotions.length > 0 ? promotions[currentPromoIndex] || promotions[0] : null;

  const selectedPricing =
    selectedPromotion && selectedPromotion.type !== "gift"
      ? calculatePricingByPromotion(car.price, selectedPromotion)
      : {
          originalPrice: Number(car.price || 0),
          discountAmount: 0,
          finalPrice: Number(car.price || 0),
        };

  const hasDiscountPromotion =
    selectedPromotion &&
    selectedPromotion.type !== "gift" &&
    Number(selectedPricing.discountAmount || 0) > 0;

  return (
    <div className="mb-detail-page">
      <MainNavbar />

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

        {promotions.length > 0 && (
          <div className="voucher-ribbon">
            <span>SALE</span>
          </div>
        )}

        <div className="mb-hero-overlay"></div>

        <div className="mb-hero-content">
          <Link to="/" className="mb-back-link">
            ← Quay lại
          </Link>

          <p className="mb-label">{car.brand}</p>
          <h1>{car.name}</h1>

          {hasDiscountPromotion ? (
            <div className="mb-price-box">
              <div className="mb-price-old">
                {formatPrice(selectedPricing.originalPrice)}
              </div>
              <p className="mb-price mb-price-sale">
                Giá ưu đãi {formatPrice(selectedPricing.finalPrice)}
              </p>
              <div className="mb-price-save">
                Tiết kiệm {formatPrice(selectedPricing.discountAmount)}
              </div>
            </div>
          ) : (
            <p className="mb-price">Giá từ {formatPrice(car.price)}</p>
          )}

          {car.overviewTitle && (
            <h3 className="mb-overview-title">{car.overviewTitle}</h3>
          )}
          {car.overviewText && (
            <p className="mb-overview-text">{car.overviewText}</p>
          )}

         <div className="mb-hero-actions">
          <button
            type="button"
            className="mb-btn mb-btn-light"
            onClick={handleConsultationClick}
          >
            Yêu cầu tư vấn
          </button>

          <button
            type="button"
            className="mb-btn mb-btn-dark"
            onClick={handleDepositClick}
          >
            Đặt cọc giữ xe
          </button>

          <a href="#specs" className="mb-btn mb-btn-dark">
            Xem thông số
          </a>
        </div>
        </div>

        {selectedPromotion && (
          <div className="mb-promo-floating-list">
            <div className="mb-promo-floating" key={selectedPromotion._id}>
              <div className="mb-promo-topbar">
                <div className="mb-promo-badge">ƯU ĐÃI</div>

                {promotions.length > 1 && (
                  <div className="mb-promo-nav">
                    <button
                      type="button"
                      className="mb-promo-nav-btn"
                      onClick={() =>
                        setCurrentPromoIndex((prev) =>
                          prev === 0 ? promotions.length - 1 : prev - 1
                        )
                      }
                    >
                      ‹
                    </button>

                    <span className="mb-promo-counter">
                      {currentPromoIndex + 1}/{promotions.length}
                    </span>

                    <button
                      type="button"
                      className="mb-promo-nav-btn"
                      onClick={() =>
                        setCurrentPromoIndex((prev) =>
                          prev === promotions.length - 1 ? 0 : prev + 1
                        )
                      }
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-promo-content">
                <h3>{selectedPromotion.title}</h3>

                {selectedPromotion.description ? (
                  <p>{selectedPromotion.description}</p>
                ) : (
                  <p>Chương trình ưu đãi đang áp dụng cho mẫu xe này.</p>
                )}

                {selectedPromotion.type === "amount" && (
                  <div className="mb-promo-highlight">
                    Giảm trực tiếp {formatPrice(selectedPromotion.value)}
                  </div>
                )}

                {selectedPromotion.type === "percent" && (
                  <div className="mb-promo-highlight">
                    Giảm {selectedPromotion.value}% giá trị xe
                  </div>
                )}

                {selectedPromotion.type === "gift" &&
                  Array.isArray(selectedPromotion.giftItems) &&
                  selectedPromotion.giftItems.length > 0 && (
                    <ul className="mb-promo-gifts">
                      {selectedPromotion.giftItems.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  )}

                <div className="mb-promo-date">
                  Áp dụng từ{" "}
                  {new Date(selectedPromotion.startDate).toLocaleDateString(
                    "vi-VN"
                  )}{" "}
                  đến{" "}
                  {new Date(selectedPromotion.endDate).toLocaleDateString(
                    "vi-VN"
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
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
                src={
                  item.image && item.image.trim() !== ""
                    ? item.image
                    : "https://via.placeholder.com/500x320?text=No+Feature+Image"
                }
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
          <div>
            <span>Hãng</span>
            <strong>{car.brand}</strong>
          </div>
          <div>
            <span>Danh mục</span>
            <strong>{car.category}</strong>
          </div>
          <div>
            <span>Năm sản xuất</span>
            <strong>{car.year}</strong>
          </div>
          <div>
            <span>Nhiên liệu</span>
            <strong>{car.fuel}</strong>
          </div>
          <div>
            <span>Hộp số</span>
            <strong>{car.transmission}</strong>
          </div>
          <div>
            <span>Số km đã đi</span>
            <strong>{car.mileage}</strong>
          </div>
          <div>
            <span>Màu xe</span>
            <strong>{car.color}</strong>
          </div>
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
          <p>TƯ VẤN MUA XE</p>
          <h2>Nhận tư vấn riêng cho {car.name}</h2>
        </div>

        <div className="mb-description-box" style={{ textAlign: "center" }}>
          <h3>
            {user
              ? `Xin chào ${user.fullName || user.name || "khách hàng"}`
              : "Đăng nhập để gửi yêu cầu tư vấn"}
          </h3>

          <p style={{ maxWidth: "760px", margin: "12px auto 24px" }}>
            {user
              ? "Bạn đã đăng nhập. Nhấn nút bên dưới để chuyển tới trang gửi yêu cầu tư vấn dành riêng cho mẫu xe này."
              : "Để đảm bảo quản lý yêu cầu tư vấn, lịch sử liên hệ và phản hồi từ showroom một cách chuyên nghiệp, vui lòng đăng nhập trước khi gửi yêu cầu."}
          </p>

        <div
          style={{
            display: "flex",
            gap: "14px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {user ? (
            <>
              <button
                type="button"
                className="mb-btn mb-btn-light"
                onClick={handleConsultationClick}
              >
                Đi tới trang yêu cầu tư vấn
              </button>

              <Link to={`/cars/${car._id}/quotation`} className="mb-btn mb-btn-dark">
                Yêu cầu báo giá
              </Link>

              <Link
                to={`/cars/${car._id}/appointment?type=view`}
                className="mb-btn mb-btn-dark"
              >
                Đặt lịch xem xe
              </Link>

              <Link
                to={`/cars/${car._id}/appointment?type=test_drive`}
                className="mb-btn mb-btn-dark"
              >
                Đặt lịch lái thử
              </Link>
            </>
          ) : (
            <button
              type="button"
              className="mb-btn mb-btn-light"
              onClick={() => navigate("/login")}
            >
              Đăng nhập ngay
            </button>
          )}
        </div>
        </div>
      </section>

      {activeFeature && (
        <div
          className="mb-feature-drawer-overlay"
          onClick={() => setActiveFeature(null)}
        >
          <div
            className="mb-feature-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-feature-drawer-header">
              <h3>Trang bị</h3>
              <button onClick={() => setActiveFeature(null)}>×</button>
            </div>

            <img
              src={
                activeFeature.image && activeFeature.image.trim() !== ""
                  ? activeFeature.image
                  : "https://via.placeholder.com/700x500?text=No+Feature+Image"
              }
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