import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/user/CarDetail.css";
import MainNavbar from "../../components/MainNavbar";
import { addToCompare } from "../../utils/compare";


export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [car, setCar] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [message, setMessage] = useState("");
  const [activeFeature, setActiveFeature] = useState(null);
  const [user, setUser] = useState(null);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  });
  const [reviewMessage, setReviewMessage] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetchCar();
    fetchReviews();

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

  const fetchReviews = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/api/reviews/car/${id}`);
    setReviews(res.data.reviews || []);
    setAvgRating(res.data.avgRating || 0);
    setReviewCount(res.data.total || 0);
  } catch (error) {
    console.log("Lỗi lấy đánh giá:", error);
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

  const handleReviewChange = (e) => {
  const { name, value } = e.target;
  setReviewForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};

const handleSubmitReview = async (e) => {
  e.preventDefault();

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  if (!token || !currentUser) {
    alert("Vui lòng đăng nhập để đánh giá xe");
    navigate("/login");
    return;
  }

  if (!car?._id) {
    setReviewMessage("Không xác định được xe để đánh giá");
    return;
  }

  try {
    const payload = {
      carId: car._id,
      userId: currentUser._id || currentUser.id,
      userName:
        currentUser.fullName ||
        currentUser.name ||
        currentUser.username ||
        currentUser.email,
      rating: Number(reviewForm.rating),
      comment: reviewForm.comment?.trim() || "",
    };

    console.log("Review payload:", payload);

    const res = await axios.post("http://localhost:5000/api/reviews", payload);

    setReviewMessage(res.data.message || "Đánh giá thành công");
    setReviewForm({
      rating: 5,
      comment: "",
    });
    fetchReviews();
    setShowReviewForm(false);
  } catch (error) {
    setReviewMessage(
      error.response?.data?.message || "Gửi đánh giá thất bại"
    );
  }
};

    const handleCompareClick = () => {
    if (!car?._id) return;

    const result = addToCompare(car._id);
    alert(result.message);

    if (result.ok) {
      navigate("/compare");
    }
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
   const renderStars = (rating = 0) => {
    const full = Math.round(Number(rating) || 0);
    return "★".repeat(full) + "☆".repeat(5 - full);
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

          <button
            type="button"
            className="mb-btn mb-btn-dark"
            onClick={handleCompareClick}
          >
            So sánh xe
          </button>
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
        <a href="#reviews">Đánh giá</a>
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

     <section id="reviews" className="mb-section">
      <div className="mb-section-heading">
        <p>ĐÁNH GIÁ KHÁCH HÀNG</p>
        <h2>Đánh giá về {car.name}</h2>
      </div>

      <div
        style={{
          background: "#111827",
          borderRadius: "24px",
          padding: "28px",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "42px",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1,
                marginBottom: "8px",
              }}
            >
              {avgRating || 0}
              <span style={{ fontSize: "22px", color: "#9ca3af", marginLeft: "6px" }}>
                /5
              </span>
            </div>

            <div
              style={{
                fontSize: "24px",
                letterSpacing: "4px",
                color: "#fbbf24",
                marginBottom: "8px",
              }}
            >
              {renderStars(avgRating)}
            </div>

            <div style={{ color: "#9ca3af", fontSize: "15px" }}>
              {reviewCount} đánh giá từ khách hàng
            </div>
          </div>

          <button
            type="button"
            className="mb-btn mb-btn-light"
            onClick={() => setShowReviewForm((prev) => !prev)}
          >
            {showReviewForm ? "Đóng đánh giá" : "Viết đánh giá"}
          </button>
        </div>

        {showReviewForm && (
          <div
            style={{
              marginTop: "24px",
              paddingTop: "24px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <form
              onSubmit={handleSubmitReview}
              style={{
                display: "grid",
                gap: "14px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    color: "#e5e7eb",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  Chọn số sao
                </label>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setReviewForm((prev) => ({ ...prev, rating: star }))
                      }
                      style={{
                        border:
                          Number(reviewForm.rating) === star
                            ? "1px solid #fbbf24"
                            : "1px solid rgba(255,255,255,0.12)",
                        background:
                          Number(reviewForm.rating) === star
                            ? "rgba(251,191,36,0.12)"
                            : "rgba(255,255,255,0.04)",
                        color:
                          Number(reviewForm.rating) === star ? "#fbbf24" : "#e5e7eb",
                        borderRadius: "12px",
                        padding: "10px 14px",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: "18px",
                      }}
                    >
                      {"★".repeat(star)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    color: "#e5e7eb",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  Nhận xét của bạn
                </label>

                <textarea
                  name="comment"
                  rows="5"
                  value={reviewForm.comment}
                  onChange={handleReviewChange}
                  placeholder="Chia sẻ trải nghiệm của bạn về mẫu xe này..."
                  style={{
                    width: "100%",
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    color: "#fff",
                    padding: "14px",
                    resize: "vertical",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                <button
                  type="submit"
                  className="mb-btn mb-btn-light"
                >
                  Gửi đánh giá
                </button>

                {reviewMessage && (
                  <span style={{ color: "#93c5fd", fontWeight: 600 }}>
                    {reviewMessage}
                  </span>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gap: "16px",
        }}
      >
        {reviews.length > 0 ? (
          reviews.map((item) => (
            <div
              key={item._id}
              style={{
                background: "#111827",
                borderRadius: "20px",
                padding: "22px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "17px",
                      marginBottom: "6px",
                    }}
                  >
                    {item.userName}
                  </div>

                  <div
                    style={{
                      color: "#fbbf24",
                      fontSize: "18px",
                      letterSpacing: "2px",
                    }}
                  >
                    {"★".repeat(item.rating)}
                    {"☆".repeat(5 - item.rating)}
                  </div>
                </div>

                <div style={{ color: "#9ca3af", fontSize: "14px" }}>
                  {new Date(item.createdAt).toLocaleString("vi-VN")}
                </div>
              </div>

              <p
                style={{
                  margin: 0,
                  color: "#d1d5db",
                  lineHeight: 1.7,
                }}
              >
                {item.comment || "Không có nhận xét"}
              </p>
            </div>
          ))
        ) : (
          <div
            style={{
              background: "#111827",
              borderRadius: "20px",
              padding: "22px",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#9ca3af",
            }}
          >
            Chưa có đánh giá nào cho xe này
          </div>
        )}
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