import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/user/Favorites.css";
import MainNavbar from "../../components/MainNavbar";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [promotionMap, setPromotionMap] = useState({});

  const navigate = useNavigate();
  const limit = 6;

  const fetchFavorites = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await axios.get("http://localhost:5000/api/favorites", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const favoritesData = res.data.favorites || [];
      setFavorites(favoritesData);
      setMessage("");
      await fetchPromotionsForCars(favoritesData);
    } catch (error) {
      console.error(error);
      setMessage(
        error?.response?.data?.message ||
          "Không tải được danh sách yêu thích"
      );
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
      console.log("Lỗi lấy voucher cho xe yêu thích:", error);
      setPromotionMap({});
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  useEffect(() => {
    const totalPages = Math.ceil(favorites.length / limit) || 1;
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [favorites, page]);

  const handleRemove = async (carId) => {
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`http://localhost:5000/api/favorites/${carId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFavorites((prev) => prev.filter((item) => item._id !== carId));
      setPromotionMap((prev) => {
        const updated = { ...prev };
        delete updated[carId];
        return updated;
      });
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("Không xóa được xe yêu thích");
    }
  };

  const getSaleText = (car) => {
    if (car?.salePercent > 0) return `SALE ${car.salePercent}%`;

    if (car?.discountPercent > 0) return `SALE ${car.discountPercent}%`;

    if (car?.promotion?.type === "percent" && car?.promotion?.value > 0) {
      return `SALE ${car.promotion.value}%`;
    }

    if (car?.promotion?.type === "amount" && car?.promotion?.value > 0) {
      return "SALE";
    }

    if (Array.isArray(car?.promotions) && car.promotions.length > 0) {
      const percentPromotion = car.promotions.find(
        (item) => item?.type === "percent" && item?.value > 0
      );
      if (percentPromotion) return `SALE ${percentPromotion.value}%`;
      return "SALE";
    }

    if (Array.isArray(car?.vouchers) && car.vouchers.length > 0) {
      return "SALE";
    }

    const promotions = promotionMap[car._id] || [];
    if (promotions.length > 0) {
      const percentPromotion = promotions.find(
        (item) => item?.type === "percent" && item?.value > 0
      );
      if (percentPromotion) return `SALE ${percentPromotion.value}%`;
      return "SALE";
    }

    if (car?.hasVoucher) {
      return "SALE";
    }

    return null;
  };

  const getCarImage = (car) => {
    if (car.image && car.image.trim() !== "") return car.image;
    if (Array.isArray(car.images) && car.images.length > 0) return car.images[0];
    return "https://via.placeholder.com/400x260?text=No+Image";
  };

  const paginatedFavorites = favorites.slice(
    (page - 1) * limit,
    page * limit
  );

  const totalPages = Math.ceil(favorites.length / limit);

  return (
    <>
      <div className="favorites-navbar-fixed">
        <MainNavbar />
      </div>

      <div className="favorites-page">
        <div className="favorites-header">
          <h1>Xe yêu thích</h1>
          <p>Hiện có {favorites.length} xe đang hiển thị</p>
        </div>

        {message && <div className="favorites-message">{message}</div>}

        <div className="favorites-grid">
          {paginatedFavorites.length > 0 ? (
            paginatedFavorites.map((car) => {
              const saleText = getSaleText(car);

              return (
                <div className="favorite-card" key={car._id}>
                  <div className="favorite-image">
                    {saleText && (
                      <div className="voucher-ribbon">
                        <span>{saleText}</span>
                      </div>
                    )}

                    <img
                      src={getCarImage(car)}
                      alt={car.name}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/400x260?text=Image+Error";
                      }}
                    />

                    <button
                      className="favorite-heart"
                      onClick={() => handleRemove(car._id)}
                      title="Xóa khỏi yêu thích"
                    >
                      ❤️
                    </button>
                  </div>

                  <div className="favorite-body">
                    <h3>{car.name}</h3>

                    <div className="info-row">
                      <span>Hãng</span>
                      <span>{car.brand || "Đang cập nhật"}</span>
                    </div>

                    <div className="info-row">
                      <span>Danh mục</span>
                      <span>{car.category || "Đang cập nhật"}</span>
                    </div>

                    <div className="info-row">
                      <span>Năm</span>
                      <span>{car.year || "2023"}</span>
                    </div>

                    <div className="price">
                      {Number(car.price || 0).toLocaleString("vi-VN")}đ
                    </div>

                    <Link to={`/cars/${car._id}`} className="btn-detail">
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="favorites-message">
              Bạn chưa có xe yêu thích nào
            </div>
          )}
        </div>

        {favorites.length > limit && (
          <div className="favorites-pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              ←
            </button>

            <span>
              {page} / {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              →
            </button>
          </div>
        )}
      </div>
    </>
  );
}