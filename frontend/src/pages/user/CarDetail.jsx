import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/user/CarDetail.css";
import MainNavbar from "../../components/MainNavbar";
import { useTranslation } from 'react-i18next';
import { addToCompare } from "../../utils/compare";

export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [car, setCar] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [message, setMessage] = useState("");
  const [activeFeature, setActiveFeature] = useState(null);
  const [user, setUser] = useState(null);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  // States cho phần Review của Thư
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
        axios.get(`https://webbanxe-backend-stx9.onrender.com/api/cars/${id}`),
        axios.get(`https://webbanxe-backend-stx9.onrender.com/api/promotions/car/${id}`),
      ]);

      setCar(carRes.data.car || null);
      setPromotions(promoRes.data.promotions || []);
      setMessage("");
    } catch (error) {
      console.log("Lỗi fetch car detail:", error);
      setMessage(t('error_fetch_detail'));
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`https://webbanxe-backend-stx9.onrender.com/api/reviews/car/${id}`);
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
    if (!promotion) return { originalPrice, discountAmount: 0, finalPrice: originalPrice };

    let discountAmount = 0;
    if (promotion.type === "amount") {
      discountAmount = Number(promotion.value || 0);
    } else if (promotion.type === "percent") {
      discountAmount = Math.round(originalPrice * (Number(promotion.value || 0) / 100));
    }

    if (discountAmount > originalPrice) discountAmount = originalPrice;

    return {
      originalPrice,
      discountAmount,
      finalPrice: Math.max(0, originalPrice - discountAmount),
    };
  };

  const carImages = useMemo(() => {
    if (!car) return [];
    const list = [];
    if (car.image && car.image.trim() !== "") list.push(car.image);
    if (Array.isArray(car.images)) {
      car.images.forEach((img) => {
        if (img && typeof img === "string" && img.trim() !== "" && !list.includes(img)) {
          list.push(img);
        }
      });
    }
    if (list.length === 0) list.push("https://via.placeholder.com/1600x900?text=No+Image");
    return list;
  }, [car]);

  const getImage = (index) => carImages[index] || carImages[0];

  const handleConsultationClick = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert(t('alert_login_consult'));
      navigate("/login");
      return;
    }
    navigate(`/cars/${car._id}/contact`);
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");

    if (!token || !currentUser) {
      alert(t('alert_login_review'));
      navigate("/login");
      return;
    }

    try {
      const payload = {
        carId: car._id,
        userId: currentUser._id || currentUser.id,
        userName: currentUser.fullName || currentUser.name || currentUser.username || currentUser.email,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment?.trim() || "",
      };

      const res = await axios.post("https://webbanxe-backend-stx9.onrender.com/api/reviews", payload);
      setReviewMessage(t('review_success_msg'));
      setReviewForm({ rating: 5, comment: "" });
      fetchReviews();
      setShowReviewForm(false);
    } catch (error) {
      setReviewMessage(error.response?.data?.message || t('review_fail_msg'));
    }
  };

  const handleCompareClick = () => {
    if (!car?._id) return;
    const result = addToCompare(car._id);
    alert(result.message);
    if (result.ok) navigate("/compare");
  };

  const handleDepositClick = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert(t('alert_login_deposit'));
      navigate("/login");
      return;
    }
    navigate(`/cars/${car._id}/deposit`);
  };

  const renderStars = (rating = 0) => {
    const full = Math.round(Number(rating) || 0);
    return "★".repeat(full) + "☆".repeat(5 - full);
  };

  if (message) return <p style={{ padding: "30px", color: "red" }}>{message}</p>;
  if (!car) return <p style={{ padding: "30px" }}>{t('loading')}</p>;

  const highlights = car.highlights && car.highlights.length > 0 ? car.highlights : [
    { title: t('default_highlight_1_title'), text: t('default_highlight_1_text'), image: getImage(0) },
    { title: t('default_highlight_2_title'), text: t('default_highlight_2_text'), image: getImage(1) },
    { title: t('default_highlight_3_title'), text: t('default_highlight_3_text'), image: getImage(2) },
  ];

  const features = car.features && car.features.length > 0 ? car.features : [
    { title: t('default_feature_1_title'), text: t('default_feature_1_text'), image: "" },
    { title: t('default_feature_2_title'), text: t('default_feature_2_text'), image: "" },
    { title: t('default_feature_3_title'), text: t('default_feature_3_text'), image: "" },
    { title: t('default_feature_4_title'), text: t('default_feature_4_text'), image: "" },
  ];

  const selectedPromotion = promotions.length > 0 ? promotions[currentPromoIndex] || promotions[0] : null;
  const selectedPricing = selectedPromotion && selectedPromotion.type !== "gift"
    ? calculatePricingByPromotion(car.price, selectedPromotion)
    : { originalPrice: Number(car.price || 0), discountAmount: 0, finalPrice: Number(car.price || 0) };

  const hasDiscountPromotion = selectedPromotion && selectedPromotion.type !== "gift" && Number(selectedPricing.discountAmount || 0) > 0;

  return (
    <div className="mb-detail-page">
      <MainNavbar />

      <section className="mb-hero">
        <img src={getImage(0)} alt={car.name} className="mb-hero-bg" />
        {promotions.length > 0 && (
          <div className="voucher-ribbon"><span>{t('sale')}</span></div>
        )}
        <div className="mb-hero-overlay"></div>
        <div className="mb-hero-content">
          <Link to="/" className="mb-back-link">{`← ${t('back')}`}</Link>
          <p className="mb-label">{car.brand}</p>
          <h1>{car.name}</h1>

          {hasDiscountPromotion ? (
            <div className="mb-price-box">
              <div className="mb-price-old">{formatPrice(selectedPricing.originalPrice)}</div>
              <p className="mb-price mb-price-sale">{t('price_promo')} {formatPrice(selectedPricing.finalPrice)}</p>
              <div className="mb-price-save">{t('price_save')} {formatPrice(selectedPricing.discountAmount)}</div>
            </div>
          ) : (
            <p className="mb-price">{t('price_from')} {formatPrice(car.price)}</p>
          )}

          <div className="mb-hero-actions">
            <button className="mb-btn mb-btn-light" onClick={handleConsultationClick}>{t('btn_request_consult')}</button>
            <button className="mb-btn mb-btn-dark" onClick={handleDepositClick}>{t('btn_deposit')}</button>
            <a href="#specs" className="mb-btn mb-btn-dark">{t('view_specs')}</a>
            <button className="mb-btn mb-btn-dark" onClick={handleCompareClick}>{t('btn_compare')}</button>
          </div>
        </div>

        {selectedPromotion && (
          <div className="mb-promo-floating-list">
            <div className="mb-promo-floating">
              <div className="mb-promo-topbar">
                <div className="mb-promo-badge">{t('promo_badge')}</div>
                {promotions.length > 1 && (
                  <div className="mb-promo-nav">
                    <button onClick={() => setCurrentPromoIndex(prev => prev === 0 ? promotions.length - 1 : prev - 1)}>‹</button>
                    <span className="mb-promo-counter">{currentPromoIndex + 1}/{promotions.length}</span>
                    <button onClick={() => setCurrentPromoIndex(prev => prev === promotions.length - 1 ? 0 : prev + 1)}>›</button>
                  </div>
                )}
              </div>
              <div className="mb-promo-content">
                <h3>{selectedPromotion.title}</h3>
                <p>{selectedPromotion.description || t('promo_default_description')}</p>
                {selectedPromotion.type === "amount" && <div className="mb-promo-highlight">{t('promo_discount_amount', { amount: formatPrice(selectedPromotion.value) })}</div>}
                {selectedPromotion.type === "percent" && <div className="mb-promo-highlight">{t('promo_discount_percent', { percent: selectedPromotion.value })}</div>}
                <div className="mb-promo-date">
                  {t('promo_date_from')} {new Date(selectedPromotion.startDate).toLocaleDateString()} {t('promo_date_to')} {new Date(selectedPromotion.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <nav className="mb-sticky-nav">
        <a href="#highlights">{t('nav_highlights')}</a>
        <a href="#features">{t('nav_features')}</a>
        <a href="#specs">{t('nav_specs')}</a>
        <a href="#reviews">{t('nav_reviews')}</a>
        <a href="#contact">{t('nav_contact')}</a>
      </nav>

      <section id="highlights" className="mb-section">
        <div className="mb-section-heading">
          <p>{t('section_highlights')}</p>
          <h2>{t('section_highlight_title', { name: car.name })}</h2>
        </div>
        <div className="mb-highlight-grid">
          {highlights.map((item, index) => (
            <div className="mb-highlight-card" key={index}>
              <img src={item.image || getImage(index)} alt={item.title} />
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
          <p>{t('section_features')}</p>
          <h2>{t('section_features_title')}</h2>
        </div>
        <div className="mb-feature-grid">
          {features.map((item, index) => (
            <button className="mb-feature-card" key={index} onClick={() => setActiveFeature(item)}>
              <img src={item.image || "https://via.placeholder.com/500x320?text=No+Image"} alt={item.title} className="mb-feature-card-image" />
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
          <p>{t('section_specs')}</p>
          <h2>{t('section_specs_title')}</h2>
        </div>
        <div className="mb-specs-card">
          <div><span>{t('label_brand')}</span><strong>{car.brand}</strong></div>
          <div><span>{t('label_category')}</span><strong>{car.category}</strong></div>
          <div><span>{t('label_year')}</span><strong>{car.year}</strong></div>
          <div><span>{t('label_fuel')}</span><strong>{car.fuel}</strong></div>
          <div><span>{t('label_transmission')}</span><strong>{car.transmission}</strong></div>
          <div><span>{t('label_mileage')}</span><strong>{car.mileage}</strong></div>
          <div><span>{t('label_color')}</span><strong>{car.color}</strong></div>
          <div><span>{t('label_status')}</span><strong>{car.status === "available" ? t('status_available') : t('status_hidden')}</strong></div>
        </div>
      </section>

      {/* Phần Review của Thư đã được bọc đa ngôn ngữ */}
      <section id="reviews" className="mb-section">
        <div className="mb-section-heading">
          <p>{t('section_reviews')}</p>
          <h2>{t('section_reviews_title', { name: car.name })}</h2>
        </div>
        <div style={{ background: "#111827", borderRadius: "24px", padding: "28px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "42px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>
                {avgRating || 0}<span style={{ fontSize: "22px", color: "#9ca3af", marginLeft: "6px" }}>/5</span>
              </div>
              <div style={{ fontSize: "24px", color: "#fbbf24", marginBottom: "8px" }}>{renderStars(avgRating)}</div>
              <div style={{ color: "#9ca3af", fontSize: "15px" }}>{reviewCount} {t('reviews_count_text')}</div>
            </div>
            <button className="mb-btn mb-btn-light" onClick={() => setShowReviewForm(!showReviewForm)}>
              {showReviewForm ? t('btn_close_review') : t('btn_write_review')}
            </button>
          </div>

          {showReviewForm && (
            <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <form onSubmit={handleSubmitReview} style={{ display: "grid", gap: "14px" }}>
                <label style={{ color: "#e5e7eb", fontWeight: 600 }}>{t('label_choose_rating')}</label>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      style={{ border: reviewForm.rating === star ? "1px solid #fbbf24" : "1px solid rgba(255,255,255,0.12)", background: reviewForm.rating === star ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.04)", color: reviewForm.rating === star ? "#fbbf24" : "#e5e7eb", borderRadius: "12px", padding: "10px", fontSize: "18px" }}>
                      {"★".repeat(star)}
                    </button>
                  ))}
                </div>
                <label style={{ color: "#e5e7eb", fontWeight: 600 }}>{t('label_your_review')}</label>
                <textarea name="comment" rows="5" value={reviewForm.comment} onChange={handleReviewChange} placeholder={t('placeholder_review')}
                  style={{ width: "100%", borderRadius: "14px", background: "rgba(255,255,255,0.04)", color: "#fff", padding: "14px", outline: "none" }} />
                <button type="submit" className="mb-btn mb-btn-light">{t('btn_submit_review')}</button>
                {reviewMessage && <span style={{ color: "#93c5fd" }}>{reviewMessage}</span>}
              </form>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          {reviews.length > 0 ? reviews.map((item) => (
            <div key={item._id} style={{ background: "#111827", borderRadius: "20px", padding: "22px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700 }}>{item.userName}</div>
                  <div style={{ color: "#fbbf24" }}>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</div>
                </div>
                <div style={{ color: "#9ca3af", fontSize: "14px" }}>{new Date(item.createdAt).toLocaleString()}</div>
              </div>
              <p style={{ color: "#d1d5db" }}>{item.comment || t('no_comment')}</p>
            </div>
          )) : <div style={{ color: "#9ca3af" }}>{t('no_reviews_yet')}</div>}
        </div>
      </section>

      <section id="contact" className="mb-section">
        <div className="mb-section-heading">
          <p>{t('contact_consult_subtitle')}</p>
          <h2>{t('contact_consult_title', { name: car.name })}</h2>
        </div>
        <div className="mb-description-box" style={{ textAlign: "center" }}>
          <h3>{user ? `${t('hello')} ${user.fullName || user.name || t('guest')}` : t('login_to_request_consult')}</h3>
          <p style={{ maxWidth: "760px", margin: "12px auto 24px" }}>
            {user ? t('consult_logged_in_help') : t('consult_not_logged_in_help')}
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            {user ? (
              <>
                <button className="mb-btn mb-btn-light" onClick={handleConsultationClick}>{t('btn_go_consult_page')}</button>
                <Link to={`/cars/${car._id}/quotation`} className="mb-btn mb-btn-dark">{t('btn_request_quote')}</Link>
                <Link to={`/cars/${car._id}/appointment?type=view`} className="mb-btn mb-btn-dark">{t('btn_book_viewing')}</Link>
                <Link to={`/cars/${car._id}/appointment?type=test_drive`} className="mb-btn mb-btn-dark">{t('btn_book_test_drive')}</Link>
              </>
            ) : (
              <button className="mb-btn mb-btn-light" onClick={() => navigate("/login")}>{t('btn_login_now')}</button>
            )}
          </div>
        </div>
      </section>

      {activeFeature && (
        <div className="mb-feature-drawer-overlay" onClick={() => setActiveFeature(null)}>
          <div className="mb-feature-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mb-feature-drawer-header">
              <h3>{t('feature_drawer_title')}</h3>
              <button onClick={() => setActiveFeature(null)}>{t('close')}</button>
            </div>
            <img src={activeFeature.image || "https://via.placeholder.com/700x500"} alt={activeFeature.title} className="mb-feature-drawer-image" />
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