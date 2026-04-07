import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/user/Favorites.css";
import MainNavbar from "../../components/MainNavbar";
import { useTranslation } from "react-i18next";
import { addToCompare } from "../../utils/compare";
import PageLoader from "../../components/PageLoader";

export default function Favorites() {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [promotionMap, setPromotionMap] = useState({});
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const limit = 6;

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
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.get("https://webbanxe-backend-stx9.onrender.com/api/favorites", {
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
      setMessage(error?.response?.data?.message || t("error_fetch_favorites"));
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
      await axios.delete(`https://webbanxe-backend-stx9.onrender.com/api/favorites/${carId}`, {
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
      setMessage(t("error_remove_favorite"));
    }
  };

  const getSaleText = (car) => {
    if (car?.salePercent > 0) return `SALE ${car.salePercent}%`;
    if (car?.discountPercent > 0) return `SALE ${car.discountPercent}%`;

    const promotions = promotionMap[car._id] || [];
    if (promotions.length > 0) {
      const percentPromotion = promotions.find(
        (item) => item?.type === "percent" && item?.value > 0
      );
      if (percentPromotion) return `SALE ${percentPromotion.value}%`;
      return "SALE";
    }
    return null;
  };

  const getCarImage = (car) => {
    if (car.image && car.image.trim() !== "") return car.image;
    if (Array.isArray(car.images) && car.images.length > 0) return car.images[0];
    return "https://via.placeholder.com/400x260?text=No+Image";
  };

  const paginatedFavorites = favorites.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(favorites.length / limit);

  if (loading) return <PageLoader />;

  return (
    <>
      <div className="favorites-navbar-fixed">
        <MainNavbar />
      </div>

      <div className="favorites-page">
        <div className="favorites-header">
          <h1>{t("favorites_title")}</h1>
          <p>{t("favorites_count_desc", { count: favorites.length })}</p>
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
                        e.target.src = "https://via.placeholder.com/400x260?text=Image+Error";
                      }}
                    />

                    <button
                      className="favorite-heart"
                      onClick={() => handleRemove(car._id)}
                      title={t("remove_from_favorites")}
                    >
                      ❤️
                    </button>
                  </div>

                  <div className="favorite-body">
                    <h3>{car.name}</h3>

                    <div className="info-row">
                      <span>{t("label_brand")}</span>
                      <span>{car.brand || t("updating")}</span>
                    </div>

                    <div className="info-row">
                      <span>{t("label_category")}</span>
                      <span>{car.category || t("updating")}</span>
                    </div>

                    <div className="info-row">
                      <span>{t("label_year")}</span>
                      <span>{car.year || "2023"}</span>
                    </div>

                    <div className="price">
                      {Number(car.price || 0).toLocaleString("vi-VN")}đ
                    </div>

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
              );
            })
          ) : (
            <div className="favorites-message">{t("no_favorites_found")}</div>
          )}
        </div>

        {favorites.length > limit && (
          <div className="favorites-pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              {" "}
              ←{" "}
            </button>
            <span>
              {" "}
              {page} / {totalPages}{" "}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              {" "}
              →{" "}
            </button>
          </div>
        )}
      </div>
    </>
  );
}