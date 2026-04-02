import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../../styles/user/CarsPage.css";
import MainNavbar from "../../components/MainNavbar";
import { useTranslation } from 'react-i18next';

export default function CarsPage() {
  const { t } = useTranslation();
  const [cars, setCars] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [promotionMap, setPromotionMap] = useState({});

  const [keyword, setKeyword] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const carsPerPage = 6;

  useEffect(() => {
    fetchCars();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, selectedBrand, selectedCategory, minPrice, maxPrice]);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/cars");
      const carsData = res.data.cars || [];
      setCars(carsData);
      setMessage("");
      await fetchPromotionsForCars(carsData);
    } catch (error) {
      console.log(error);
      setMessage("Không lấy được danh sách xe");
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
      console.log("Lỗi lấy voucher cho xe:", error);
      setPromotionMap({});
    }
  };

  const hasVoucher = (carId) => {
    return Array.isArray(promotionMap[carId]) && promotionMap[carId].length > 0;
  };

  const brands = useMemo(() => {
    return [...new Set(cars.map((car) => car.brand).filter(Boolean))];
  }, [cars]);

  const categories = useMemo(() => {
    return [...new Set(cars.map((car) => car.category).filter(Boolean))];
  }, [cars]);

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const matchesKeyword =
        !keyword ||
        car.name?.toLowerCase().includes(keyword.toLowerCase()) ||
        car.brand?.toLowerCase().includes(keyword.toLowerCase());

      const matchesBrand = !selectedBrand || car.brand === selectedBrand;
      const matchesCategory =
        !selectedCategory || car.category === selectedCategory;
      const matchesMinPrice =
        !minPrice || Number(car.price) >= Number(minPrice);
      const matchesMaxPrice =
        !maxPrice || Number(car.price) <= Number(maxPrice);

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

      {/* i18n */}

      <section className="cars-hero">
        <div className="cars-hero-overlay"></div>
        <img
          src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1600&q=80"
          alt="cars banner"
          className="cars-hero-bg"
        />
        <div className="cars-hero-content">
          <p className="cars-hero-subtitle">{t('cars_hero_subtitle')}</p>
          <h1>{t('cars_hero_title')}</h1>
          <p>{t('cars_hero_desc')}</p>
        </div>
      </section>

      <section className="cars-filter-section">
        <div className="cars-filter-box">
          <div className="cars-filter-top">
            <h2>{t('cars_filter_title')}</h2>
            <button className="reset-btn" onClick={resetFilters}>
              {t('cars_filter_reset')}
            </button>
          </div>

          <div className="cars-filter-grid">
            <input
              type="text"
              placeholder={t('filter_name_placeholder')}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />

            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="">{t('filter_brand_placeholder')}</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">{t('filter_category_placeholder')}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder={t('filter_price_from')}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />

            <input
              type="number"
              placeholder={t('filter_price_to')}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="cars-list-section">
        <div className="cars-list-header">
          <p>
            {t('cars_list_showing', { count: filteredCars.length })}
            {filteredCars.length > 0 && totalPages > 1
              ? ` • ${t('cars_list_page', { current: currentPage, total: totalPages })}`
              : ""}
          </p>
        </div>

        {loading && <p className="cars-message">{t('loading')}</p>}
        {message && <p className="cars-message error">{message}</p>}

        {!loading && !message && (
          <>
            <div className="cars-grid">
              {paginatedCars.length > 0 ? (
                paginatedCars.map((car) => (
                  <div className="cars-card" key={car._id}>
                    <div className="cars-card-image-wrap">
                      {hasVoucher(car._id) && (
                                <div className="voucher-ribbon">
                                  <span>{t('sale')}</span>
                                </div>
                      )}

                      <img
                        src={getCarImage(car)}
                        alt={car.name}
                        className="cars-card-image"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/400x250?text=Image+Error";
                        }}
                      />
                    </div>

                    <div className="cars-card-content">
                      <h3>{car.name}</h3>

                      <div className="cars-card-meta">
                        <p>
                          <span>{t('label_brand')}</span>
                          <strong>{car.brand}</strong>
                        </p>
                        <p>
                          <span>{t('label_category')}</span>
                          <strong>{car.category}</strong>
                        </p>
                        <p>
                          <span>{t('label_year')}</span>
                          <strong>{car.year}</strong>
                        </p>
                      </div>

                      <p className="cars-card-price">
                        {Number(car.price || 0).toLocaleString("vi-VN")}đ
                      </p>

                      <Link to={`/cars/${car._id}`} className="cars-detail-link">
                        {t('view_details')}
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="cars-message">{t('no_cars_found')}</p>
              )}
            </div>

            {filteredCars.length > 0 && totalPages > 1 && (
              <div className="cars-pagination">
                <button
                  className="cars-page-btn"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  >
                  {t('pagination_prev')}
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={`cars-page-number ${
                        currentPage === page ? "active" : ""
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  className="cars-page-btn"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  >
                  {t('pagination_next')}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}