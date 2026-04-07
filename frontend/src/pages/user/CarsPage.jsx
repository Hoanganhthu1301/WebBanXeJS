import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import axios from "axios";
import "../../styles/user/CarsPage.css";
import MainNavbar from "../../components/MainNavbar";
import { useTranslation } from "react-i18next";
import { addToCompare } from "../../utils/compare";

export default function CarsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [cars, setCars] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [promotionMap, setPromotionMap] = useState({});
  const [favoriteIds, setFavoriteIds] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const carsPerPage = 6;

  useEffect(() => {
    fetchCars();
    fetchFavorites();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, selectedBrand, selectedCategory, minPrice, maxPrice]);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://webbanxe-backend-stx9.onrender.com/api/cars");
      const carsData = res.data.cars || [];
      setCars(carsData);
      setMessage("");
      await fetchPromotionsForCars(carsData);
      await fetchFavorites();
    } catch (error) {
      console.log(error);
      setMessage(t("error_fetch_cars"));
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotionsForCars = async (carsData) => {
    try {
      const requests = carsData.map((car) =>
        axios
          .get(`https://webbanxe-backend-stx9.onrender.com/api/promotions/car/${car._id}`)
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
    }
  };

  const fetchFavorites = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setFavoriteIds([]);
      return;
    }
    try {
      const res = await axios.get("https://webbanxe-backend-stx9.onrender.com/api/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const favoritesData = res.data.favorites || [];
      const ids = favoritesData
        .map((item) => {
          if (item?._id && item?.name) return item._id;
          if (item?.carId?._id) return item.carId._id;
          if (item?.carId) return item.carId;
          return item?._id || null;
        })
        .filter(Boolean);
      setFavoriteIds(ids);
    } catch (error) {
      console.log("Lỗi lấy danh sách yêu thích:", error);
    }
  };

  const handleToggleFavorite = async (carId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert(t("alert_login_favorite"));
      navigate("/login");
      return;
    }
    try {
      await axios.post(
        `https://webbanxe-backend-stx9.onrender.com/api/favorites/toggle/${carId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchFavorites();
    } catch (error) {
      alert(t("error_update_favorite"));
    }
  };

  const handleCompare = (carId) => {
    const result = addToCompare(carId);
    alert(result.message);
    if (result.ok) navigate("/compare");
  };

  const hasVoucher = (carId) =>
    Array.isArray(promotionMap[carId]) && promotionMap[carId].length > 0;
  const isFavorite = (carId) => favoriteIds.includes(carId);

  const brands = useMemo(
    () => [...new Set(cars.map((car) => car.brand).filter(Boolean))],
    [cars]
  );
  const categories = useMemo(
    () => [...new Set(cars.map((car) => car.category).filter(Boolean))],
    [cars]
  );

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const matchesKeyword =
        !keyword ||
        car.name?.toLowerCase().includes(keyword.toLowerCase()) ||
        car.brand?.toLowerCase().includes(keyword.toLowerCase());
      const matchesBrand = !selectedBrand || car.brand === selectedBrand;
      const matchesCategory = !selectedCategory || car.category === selectedCategory;
      const matchesMinPrice = !minPrice || Number(car.price) >= Number(minPrice);
      const matchesMaxPrice = !maxPrice || Number(car.price) <= Number(maxPrice);
      return (
        matchesKeyword &&
        matchesBrand &&
        matchesCategory &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });
  }, [cars, keyword, selectedBrand, selectedCategory, minPrice, maxPrice]);

  const totalPages = Math.ceil(filteredCars.length / carsPerPage);
  const startIndex = (currentPage - 1) * carsPerPage;
  const paginatedCars = filteredCars.slice(startIndex, startIndex + carsPerPage);

  const resetFilters = () => {
    setKeyword("");
    setSelectedBrand("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setCurrentPage(1);
  };

  const getCarImage = (car) => {
    if (car.image && car.image.trim() !== "") return car.image;
    if (Array.isArray(car.images) && car.images.length > 0) return car.images[0];
    return "https://via.placeholder.com/400x250?text=No+Image";
  };

  return (
    <div className="cars-page">
      <MainNavbar />

      <section className="cars-hero">
        <div className="cars-hero-overlay"></div>
        <img
          src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1600&q=80"
          alt="banner"
          className="cars-hero-bg"
        />
        <div className="cars-hero-content" data-aos="fade-up" data-aos-duration="1200">
          <p className="cars-hero-subtitle" data-aos="fade-down" data-aos-delay="100">
            {t("cars_hero_subtitle")}
          </p>
          <h1 data-aos="zoom-in" data-aos-delay="200">{t("cars_hero_title")}</h1>
          <p data-aos="fade-up" data-aos-delay="300">{t("cars_hero_desc")}</p>
        </div>
      </section>

      <section className="cars-filter-section">
        <div className="cars-filter-box" data-aos="fade-up">
          <div className="cars-filter-top">
            <h2>{t("cars_filter_title")}</h2>
            <button className="reset-btn" onClick={resetFilters}>
              {t("cars_filter_reset")}
            </button>
          </div>
          <div className="cars-filter-grid">
            <input
              type="text"
              placeholder={t("filter_name_placeholder")}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
              <option value="">{t("filter_brand_placeholder")}</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">{t("filter_category_placeholder")}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder={t("filter_price_from")}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              type="number"
              placeholder={t("filter_price_to")}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="cars-list-section">
        <div className="cars-list-header" data-aos="fade-up">
          <p>
            {t("cars_list_showing", { count: filteredCars.length })}
            {filteredCars.length > 0 && totalPages > 1
              ? ` • ${t("cars_list_page", { current: currentPage, total: totalPages })}`
              : ""}
          </p>
        </div>

        {loading && <p className="cars-message">{t("loading")}</p>}
        {message && <p className="cars-message error">{message}</p>}

        {!loading && !message && (
          <>
            <div className="cars-grid">
              {paginatedCars.length > 0 ? (
                paginatedCars.map((car, index) => (
                  <div
                    className="cars-card"
                    key={car._id}
                    data-aos="fade-up"
                    data-aos-delay={(index % carsPerPage) * 100}
                  >
                    <div className="cars-card-image-wrap">
                      {hasVoucher(car._id) && (
                        <div className="voucher-ribbon">
                          <span>{t("sale")}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(car._id)}
                        className={`cars-favorite-btn ${isFavorite(car._id) ? "active" : ""}`}
                        title={t("favorite_title")}
                      >
                        <Heart size={18} fill={isFavorite(car._id) ? "currentColor" : "none"} />
                      </button>
                      <img src={getCarImage(car)} alt={car.name} className="cars-card-image" />
                    </div>

                    <div className="cars-card-content">
                      <h3>{car.name}</h3>
                      <div className="cars-card-meta">
                        <p>
                          <span>{t("label_brand")}</span>
                          <strong>{car.brand}</strong>
                        </p>
                        <p>
                          <span>{t("label_category")}</span>
                          <strong>{car.category}</strong>
                        </p>
                        <p>
                          <span>{t("label_year")}</span>
                          <strong>{car.year}</strong>
                        </p>
                      </div>
                      <p className="cars-card-price">
                        {Number(car.price || 0).toLocaleString("vi-VN")}đ
                      </p>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "12px",
                          marginTop: "16px",
                        }}
                      >
                        <Link
                          to={`/cars/${car._id}`}
                          className="cars-detail-link-new"
                          style={{
                            height: "52px",
                            borderRadius: "12px",
                            background: "#fff",
                            color: "#111",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textDecoration: "none",
                          }}
                        >
                          {t("btn_view_detail")}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCompare(car._id)}
                          style={{
                            height: "52px",
                            border: "1px solid rgba(255,255,255,0.14)",
                            borderRadius: "12px",
                            background: "rgba(255,255,255,0.04)",
                            color: "#fff",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {t("btn_compare")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="cars-message">{t("no_cars_found")}</p>
              )}
            </div>

            {filteredCars.length > 0 && totalPages > 1 && (
              <div className="cars-pagination" data-aos="fade-up">
                <button
                  className="cars-page-btn"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  {t("pagination_prev")}
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`cars-page-number ${currentPage === page ? "active" : ""}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  className="cars-page-btn"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  {t("pagination_next")}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}