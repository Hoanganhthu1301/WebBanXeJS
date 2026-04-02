import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/user/CarDetail.css";
import MainNavbar from "../../components/MainNavbar";
import { useTranslation } from 'react-i18next';

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

  const { t } = useTranslation();

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
      alert(t('alert_login_consult'));
      navigate("/login");
      return;
    }

    navigate(`/cars/${car._id}/contact`);
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

  if (message) {
    return <p style={{ padding: "30px", color: "red" }}>{message}</p>;
  }

  if (!car) {
    return <p style={{ padding: "30px" }}>{t('loading')}</p>;
  }

  const highlights =
    car.highlights && car.highlights.length > 0
      ? car.highlights
      : [
            {
              title: t('default_highlight_1_title'),
              text: t('default_highlight_1_text'),
              image: getImage(0),
            },
            {
              title: t('default_highlight_2_title'),
              text: t('default_highlight_2_text'),
              image: getImage(1),
            },
            {
              title: t('default_highlight_3_title'),
              text: t('default_highlight_3_text'),
              image: getImage(2),
            },
          ];

  const features =
    car.features && car.features.length > 0
      ? car.features
      : [
            {
              title: t('default_feature_1_title'),
              text: t('default_feature_1_text'),
              image: "",
            },
            {
              title: t('default_feature_2_title'),
              text: t('default_feature_2_text'),
              image: "",
            },
            {
              title: t('default_feature_3_title'),
              text: t('default_feature_3_text'),
              image: "",
            },
            {
              title: t('default_feature_4_title'),
              text: t('default_feature_4_text'),
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
            <span>{t('sale')}</span>
          </div>
        )}

        <div className="mb-hero-overlay"></div>

        <div className="mb-hero-content">
          <Link to="/" className="mb-back-link">
            {`← ${t('back')}`}
          </Link>

          <p className="mb-label">{car.brand}</p>
          <h1>{car.name}</h1>

          {hasDiscountPromotion ? (
            <div className="mb-price-box">
              <div className="mb-price-old">
                {formatPrice(selectedPricing.originalPrice)}
              </div>
              <p className="mb-price mb-price-sale">
                {t('price_promo')} {formatPrice(selectedPricing.finalPrice)}
              </p>
              <div className="mb-price-save">
                {t('price_save')} {formatPrice(selectedPricing.discountAmount)}
              </div>
            </div>
          ) : (
            <p className="mb-price">{t('price_from')} {formatPrice(car.price)}</p>
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
              {t('btn_request_consult')}
            </button>

            <button
              type="button"
              className="mb-btn mb-btn-dark"
              onClick={handleDepositClick}
            >
              {t('btn_deposit')}
            </button>

            <a href="#specs" className="mb-btn mb-btn-dark">
              {t('view_specs')}
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
                  <p>{t('promo_default_description')}</p>
                )}

                {selectedPromotion.type === "amount" && (
                  <div className="mb-promo-highlight">
                    {t('promo_discount_amount', { amount: formatPrice(selectedPromotion.value) })}
                  </div>
                )}

                {selectedPromotion.type === "percent" && (
                  <div className="mb-promo-highlight">
                    {t('promo_discount_percent', { percent: selectedPromotion.value })}
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
          <p>{t('section_features')}</p>
          <h2>{t('section_features_title')}</h2>
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
          <p>{t('section_specs')}</p>
          <h2>{t('section_specs_title')}</h2>
        </div>

        <div className="mb-specs-card">
          <div>
            <span>{t('label_brand')}</span>
            <strong>{car.brand}</strong>
          </div>
          <div>
            <span>{t('label_category')}</span>
            <strong>{car.category}</strong>
          </div>
          <div>
            <span>{t('label_year')}</span>
            <strong>{car.year}</strong>
          </div>
          <div>
            <span>{t('label_fuel')}</span>
            <strong>{car.fuel}</strong>
          </div>
          <div>
            <span>{t('label_transmission')}</span>
            <strong>{car.transmission}</strong>
          </div>
          <div>
            <span>{t('label_mileage')}</span>
            <strong>{car.mileage}</strong>
          </div>
          <div>
            <span>{t('label_color')}</span>
            <strong>{car.color}</strong>
          </div>
          <div>
            <span>{t('label_status')}</span>
            <strong>{car.status === "available" ? t('status_available') : t('status_hidden')}</strong>
          </div>
        </div>

        <div className="mb-description-box">
          <h3>{t('section_description')}</h3>
          <p>{car.description || t('no_description')}</p>
        </div>
      </section>

      <section id="contact" className="mb-section">
          <div className="mb-section-heading">
          <p>{t('contact_consult_subtitle')}</p>
          <h2>{t('contact_consult_title', { name: car.name })}</h2>
        </div>

        <div className="mb-description-box" style={{ textAlign: "center" }}>
          <h3>
            {user
              ? `${t('hello')} ${user.fullName || user.name || t('guest')}`
              : t('login_to_request_consult')}
          </h3>

          <p style={{ maxWidth: "760px", margin: "12px auto 24px" }}>
            {user
              ? t('consult_logged_in_help')
              : t('consult_not_logged_in_help')}
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
              <button
                type="button"
                className="mb-btn mb-btn-light"
                onClick={handleConsultationClick}
              >
                {t('btn_go_consult_page')}
              </button>
            ) : (
              <button
                type="button"
                className="mb-btn mb-btn-light"
                onClick={() => navigate("/login")}
              >
                {t('btn_login_now')}
              </button>
            )}

            <button
              type="button"
              className="mb-btn mb-btn-dark"
              onClick={handleDepositClick}
            >
              {t('btn_deposit')}
            </button>
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
              <h3>{t('feature_drawer_title')}</h3>
              <button onClick={() => setActiveFeature(null)}>{t('close')}</button>
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