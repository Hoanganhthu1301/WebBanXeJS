import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import axios from "axios";
import "../../styles/user/CarsPage.css";
import MainNavbar from "../../components/MainNavbar";
import { addToCompare } from "../../utils/compare";

export default function CarsPage() {
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
      const res = await axios.get("http://localhost:5000/api/cars");
      const carsData = res.data.cars || [];
      setCars(carsData);
      setMessage("");
      await fetchPromotionsForCars(carsData);
      await fetchFavorites();
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

  const navigate = useNavigate();

  const handleCompare = (carId) => {
    const result = addToCompare(carId);
    alert(result.message);

    if (result.ok) {
      navigate("/compare");
    }
  };

    const fetchFavorites = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setFavoriteIds([]);
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/api/favorites", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const favoritesData = res.data.favorites || [];

        const ids = favoritesData
          .map((item) => {
            if (item?._id && item?.name) return item._id; // car object
            if (item?.carId?._id) return item.carId._id;  // wrapped object
            if (item?.carId) return item.carId;           // raw id
            if (item?._id) return item._id;
            return null;
          })
          .filter(Boolean);

        setFavoriteIds(ids);
      } catch (error) {
        console.log("Lỗi lấy danh sách yêu thích:", error);
        setFavoriteIds([]);
      }
    };

const isFavorite = (carId) => favoriteIds.includes(carId);

const handleToggleFavorite = async (carId) => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Vui lòng đăng nhập để thêm xe vào yêu thích");
    navigate("/login");
    return;
  }

  try {
    await axios.post(
      `http://localhost:5000/api/favorites/toggle/${carId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    await fetchFavorites();
  } catch (error) {
    console.log(error.response?.data || error.message);
    alert(error.response?.data?.message || "Không thể cập nhật yêu thích");
  }
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
          alt="cars banner"
          className="cars-hero-bg"
        />
        <div className="cars-hero-content">
          <p className="cars-hero-subtitle">BỘ SƯU TẬP XE</p>
          <h1>Khám phá các mẫu xe nổi bật</h1>
          <p>
            Tìm chiếc xe phù hợp với nhu cầu của bạn thông qua bộ lọc thông minh.
          </p>
        </div>
      </section>

      <section className="cars-filter-section">
        <div className="cars-filter-box">
          <div className="cars-filter-top">
            <h2>Tìm kiếm & lọc xe</h2>
            <button className="reset-btn" onClick={resetFilters}>
              Xóa bộ lọc
            </button>
          </div>

          <div className="cars-filter-grid">
            <input
              type="text"
              placeholder="Tìm theo tên xe hoặc hãng..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />

            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="">-- Chọn hãng --</option>
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
              <option value="">-- Chọn danh mục --</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Giá từ"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />

            <input
              type="number"
              placeholder="Giá đến"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="cars-list-section">
        <div className="cars-list-header">
          <p>
            Đang hiển thị {filteredCars.length} xe
            {filteredCars.length > 0 && totalPages > 1
              ? ` • Trang ${currentPage}/${totalPages}`
              : ""}
          </p>
        </div>

        {loading && <p className="cars-message">Đang tải dữ liệu...</p>}
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
                          <span>SALE</span>
                        </div>
                      )}

                       <button
                        type="button"
                        onClick={() => handleToggleFavorite(car._id)}
                        className={`cars-favorite-btn ${isFavorite(car._id) ? "active" : ""}`}
                        title="Yêu thích"
                      >
                        <Heart
                          size={18}
                          fill={isFavorite(car._id) ? "currentColor" : "none"}
                        />
                      </button>


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
                          <span>Hãng</span>
                          <strong>{car.brand}</strong>
                        </p>
                        <p>
                          <span>Danh mục</span>
                          <strong>{car.category}</strong>
                        </p>
                        <p>
                          <span>Năm</span>
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
                    Xem chi tiết
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
                    So sánh
                  </button>
                  </div>

                    </div>
                  </div>
                ))
              ) : (
                <p className="cars-message">Không tìm thấy xe phù hợp</p>
              )}
            </div>

            {filteredCars.length > 0 && totalPages > 1 && (
              <div className="cars-pagination">
                <button
                  className="cars-page-btn"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ← Trước
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
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}