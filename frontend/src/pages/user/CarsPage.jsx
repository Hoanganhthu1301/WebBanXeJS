import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../../styles/user/CarsPage.css";

export default function CarsPage() {
  const [cars, setCars] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/cars");
      setCars(res.data.cars || []);
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Không lấy được danh sách xe");
    } finally {
      setLoading(false);
    }
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

      const matchesBrand =
        !selectedBrand || car.brand === selectedBrand;

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

  const resetFilters = () => {
    setKeyword("");
    setSelectedBrand("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
  };

  const getCarImage = (car) => {
    if (car.image && car.image.trim() !== "") return car.image;
    if (Array.isArray(car.images) && car.images.length > 0) return car.images[0];
    return "https://via.placeholder.com/400x250?text=No+Image";
  };

  return (
    <div className="cars-page">
      <header className="cars-header">
        <div className="cars-header-inner">
          <Link to="/" className="cars-logo">
            ★ CAR SHOP
          </Link>

          <nav className="cars-nav">
            <Link to="/">Trang chủ</Link>
            <Link to="/cars" className="active">
              Danh sách xe
            </Link>
            <Link to="/login">Đăng nhập</Link>
          </nav>
        </div>
      </header>

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
          <p>Đang hiển thị {filteredCars.length} xe</p>
        </div>

        {loading && <p className="cars-message">Đang tải dữ liệu...</p>}
        {message && <p className="cars-message error">{message}</p>}

        {!loading && !message && (
          <div className="cars-grid">
            {filteredCars.length > 0 ? (
              filteredCars.map((car) => (
                <div className="cars-card" key={car._id}>
                  <div className="cars-card-image-wrap">
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

                    <Link to={`/cars/${car._id}`} className="cars-detail-link">
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="cars-message">Không tìm thấy xe phù hợp</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}