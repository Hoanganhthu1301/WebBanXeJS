import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/user/Favorites.css";
import MainNavbar from "../../components/MainNavbar";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);

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

      setFavorites(res.data.favorites || []);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage(
        error?.response?.data?.message ||
          "Không tải được danh sách yêu thích"
      );
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (carId) => {
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`http://localhost:5000/api/favorites/${carId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFavorites((prev) => prev.filter((item) => item._id !== carId));
    } catch (error) {
      console.error(error);
      setMessage("Không xóa được xe yêu thích");
    }
  };

  const paginatedFavorites = favorites.slice(
    (page - 1) * limit,
    page * limit
  );

  return (
    <div className="favorites-page">
        <MainNavbar />
      <div className="favorites-header">
        <h1>Xe yêu thích</h1>
        <p>Hiện có {favorites.length} xe đang hiển thị</p>
      </div>

      {message && <div className="favorites-message">{message}</div>}

      <div className="favorites-grid">
        {paginatedFavorites.map((car) => (
          <div className="favorite-card" key={car._id}>
            <div className="favorite-image">
              <img
                src={
                  car.image ||
                  car.images?.[0] ||
                  "https://via.placeholder.com/400x260"
                }
                alt={car.name}
              />

              <button className="favorite-heart">❤️</button>
            </div>

            <div className="favorite-body">
              <h3>{car.name}</h3>

              <div className="info-row">
                <span>Hãng</span>
                <span>{car.brand}</span>
              </div>

              <div className="info-row">
                <span>Danh mục</span>
                <span>{car.category}</span>
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
        ))}
      </div>

      {/* pagination */}
      {favorites.length > limit && (
        <div className="favorites-pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            ←
          </button>
          <span>{page}</span>
          <button
            disabled={page * limit >= favorites.length}
            onClick={() => setPage(page + 1)}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}