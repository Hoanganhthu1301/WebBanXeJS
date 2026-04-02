import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Heart,
  CarFront,
  BadgeDollarSign,
  ShieldCheck,
  Wrench,
  Phone,
  Mail,
  MapPin,
  Clock3,
} from "lucide-react";
import "../../styles/user/Home.css";
import MainNavbar from "../../components/MainNavbar";
import { useTranslation } from 'react-i18next';
import heroVideo from "../../assets/tiktok_nwm_7521664058559532310.mp4";

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [cars, setCars] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [promotionMap, setPromotionMap] = useState({});

  useEffect(() => {
    fetchCars();
    fetchFavorites();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/cars");
      const carsData = res.data.cars || [];
      setCars(carsData);
      setMessage("");
      await fetchPromotionsForCars(carsData);
    } catch (error) {
      console.log("Lỗi lấy xe:", error);
      setMessage(t('error_fetch_cars'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotionsForCars = async (carsData) => {
    try {
      const requests = carsData.map((car) =>
        axios
          .get(`http://localhost:5000/api/promotions/car/${car._id}`)
          .then((res) => ({
            carId: car._id,
            promotions: res.data.promotions || [],
          }))
          .catch(() => ({
            carId: car._id,
            promotions: [],
          }))
      );
      const results = await Promise.all(requests);
      const map = {};
      results.forEach((item) => {
        map[item.carId] = item.promotions;
      });
      setPromotionMap(map);
    } catch (error) {
      console.log("Lỗi lấy voucher:", error);
      setPromotionMap({});
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
        headers: { Authorization: `Bearer ${token}` },
      });
      const favorites = res.data.favorites || [];
      setFavoriteIds(favorites.map((item) => item._id));
    } catch (error) {
      console.log("Lỗi lấy yêu thích:", error);
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
      const res = await axios.post(`http://localhost:5000/api/favorites/toggle/${carId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const isFav = res.data.isFavorite;
      setFavoriteIds((prev) => isFav ? [...new Set([...prev, carId])] : prev.filter((id) => id !== carId));
    } catch (error) {
      alert(t('error_update_favorite'));
    }
  };

  const isFavorite = (carId) => favoriteIds.includes(carId);
  const hasVoucher = (carId) => Array.isArray(promotionMap[carId]) && promotionMap[carId].length > 0;

  const getCarImage = (car) => {
    if (car.image && car.image.trim() !== "") return car.image;
    if (Array.isArray(car.images) && car.images.length > 0) return car.images[0];
    return "https://via.placeholder.com/400x250?text=No+Images";
  };

  const topSellingCars = useMemo(() => {
    return [...cars]
      .sort((a, b) => Number(b.soldCount || 0) - Number(a.soldCount || 0))
      .slice(0, 3);
  }, [cars]);

  return (
    <div className="home-page">
      <MainNavbar />

      <section className="hero">
        <video className="hero-video" autoPlay muted loop playsInline>
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="hero-subtitle">{t('hero_subtitle')}</p>
          <h1>
            {t('hero_title_line1')}
            <br />
            {t('hero_title_line2')}
          </h1>
          <p className="hero-desc">{t('hero_desc')}</p>

          <div className="hero-buttons">
            <Link to="/cars" className="btn btn-outline">{t('btn_explore_offers')}</Link>
            <Link to="/cars" className="btn btn-primary">{t('btn_view_all_cars')}</Link>
          </div>
        </div>
      </section>

      <section className="featured-section" id="featured">
        <div className="section-shell">
          <div className="section-head section-head-light">
            <p>{t('section_best_seller')}</p>
            <h2>{t('section_featured_cars')}</h2>
          </div>

          {loading && <p className="home-message">{t('loading')}</p>}
          {message && <p className="home-message error">{message}</p>}

          {!loading && !message && (
            <div className="car-grid">
              {topSellingCars.length > 0 ? (
                topSellingCars.map((car, index) => (
                  <div className="car-card" key={car._id || index}>
                    <div className="car-images-wrap">
                      <img src={getCarImage(car)} alt={car.name} className="car-images" />
                      {hasVoucher(car._id) && (
                        <div className="voucher-ribbon"><span>{t('sale')}</span></div>
                      )}
                      <button type="button" className="favorite-btn" onClick={(e) => handleToggleFavorite(e, car._id)}>
                        <Heart size={18} color={isFavorite(car._id) ? "#ff4d6d" : "#ffffff"} fill={isFavorite(car._id) ? "#ff4d6d" : "none"} />
                      </button>
                    </div>

                    <div className="car-info">
                      <h3>{car.name}</h3>
                      <div className="car-meta">
                        <p><span>{t('label_brand')}</span><strong>{car.brand || t('updating')}</strong></p>
                        <p><span>{t('label_category')}</span><strong>{car.category || t('updating')}</strong></p>
                        <p><span>{t('label_year')}</span><strong>{car.year || t('updating')}</strong></p>
                      </div>
                      <p className="car-price">{Number(car.price || 0).toLocaleString("vi-VN")}đ</p>
                      <Link to={`/cars/${car._id}`} className="detail-link">{t('view_details')}</Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="home-message">{t('no_cars_found')}</p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="showroom-section">
        <div className="showroom-grid">
          <div className="showroom-content">
            <p className="section-label">{t('showroom_label')}</p>
            <h2>{t('showroom_title_line1')}<br />{t('showroom_title_line2')}</h2>
            <p className="showroom-desc">{t('showroom_desc_1')}</p>
            <p className="showroom-desc">{t('showroom_desc_2')}</p>
            <Link to="/cars" className="showroom-btn">{t('btn_explore_showroom')}</Link>
          </div>
          <div>
            <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80" alt="showroom" className="showroom-image" />
          </div>
        </div>
      </section>

      <section className="services-section" id="services">
        <div className="section-shell">
          <div className="section-head">
            <p>{t('services_label')}</p>
            <h2>{t('services_title')}</h2>
            <span>{t('services_desc')}</span>
          </div>
          <div className="services-list">
            <div className="service-item"><CarFront size={30} /><h3>{t('service_1_title')}</h3><p>{t('service_1_desc')}</p></div>
            <div className="service-item"><BadgeDollarSign size={30} /><h3>{t('service_2_title')}</h3><p>{t('service_2_desc')}</p></div>
            <div className="service-item"><ShieldCheck size={30} /><h3>{t('service_3_title')}</h3><p>{t('service_3_desc')}</p></div>
            <div className="service-item"><Wrench size={30} /><h3>{t('service_4_title')}</h3><p>{t('service_4_desc')}</p></div>
          </div>
        </div>
      </section>

      <section className="contact-section">
        <div className="contact-wrap">
          <div className="contact-shell">
            <div className="contact-top">
              <p className="contact-kicker">{t('contact_label')}</p>
              <h2>{t('contact_title')}</h2>
              <span>{t('contact_desc')}</span>
            </div>
            <div className="contact-main-grid">
              <div className="contact-main-card">
                <div className="contact-main-heading"><h3>{t('company_name')}</h3><p>{t('company_desc')}</p></div>
                <div className="contact-info-grid">
                  <div className="contact-info-box"><div className="contact-info-icon"><Phone size={18} /></div><div><strong>{t('label_hotline')}</strong><span>0909 123 456</span></div></div>
                  <div className="contact-info-box"><div className="contact-info-icon"><Mail size={18} /></div><div><strong>{t('label_email')}</strong><span>support@webbanxe.vn</span></div></div>
                  <div className="contact-info-box"><div className="contact-info-icon"><MapPin size={18} /></div><div><strong>{t('label_address')}</strong><span>475A Điện Biên Phủ, Bình Thạnh, TP.HCM</span></div></div>
                  <div className="contact-info-box"><div className="contact-info-icon"><Clock3 size={18} /></div><div><strong>{t('label_support_hours')}</strong><span>{t('support_hours_val')}</span></div></div>
                </div>
              </div>
              <div className="contact-side-column">
                <div className="contact-side-card"><p className="contact-side-label">{t('support_label')}</p><h4>{t('support_title')}</h4><span>{t('support_desc')}</span></div>
                <div className="contact-side-card"><p className="contact-side-label">{t('connect_label')}</p><div className="contact-socials"><a href="#"><Phone size={20} /></a><a href="#"><Mail size={20} /></a><a href="#"><MapPin size={20} /></a></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}