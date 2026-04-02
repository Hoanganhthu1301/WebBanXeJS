import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/user/ContactPage.css";
import MainNavbar from "../../components/MainNavbar";

const initialForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  province: "Việt Nam",
  additionalInfo: "",
};

export default function QuotationPage() {
  const { id } = useParams();

  const [car, setCar] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCar();
  }, [id]);

  const fetchCar = async () => {
    try {
      const res = await axios.get(`https://webbanxe-backend-stx9.onrender.com/api/cars/${id}`);
      setCar(res.data.car);
    } catch (error) {
      setMessage("Không lấy được thông tin xe");
    }
  };

  const carImage = useMemo(() => {
    if (!car) return "https://via.placeholder.com/600x400?text=No+Image";
    if (car.image && car.image.trim() !== "") return car.image;
    if (Array.isArray(car.images) && car.images.length > 0) return car.images[0];
    return "https://via.placeholder.com/600x400?text=No+Image";
  }, [car]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!car?._id) {
      setMessage("Không xác định được xe");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const payload = {
        ...formData,
        carId: car._id,
      };

      const res = await axios.post("https://webbanxe-backend-stx9.onrender.com/api/quotations", payload);
      setMessage(res.data.message || "Gửi yêu cầu báo giá thành công");
      setFormData(initialForm);
    } catch (error) {
      setMessage(error.response?.data?.message || "Gửi yêu cầu báo giá thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <MainNavbar />

      <div className="contact-container">
        <div className="contact-left">
          <p className="contact-subtitle">
            Gửi yêu cầu báo giá để chúng tôi hỗ trợ chi tiết cho mẫu xe bạn đang quan tâm.
          </p>

          <form className="contact-form" onSubmit={handleSubmit}>
            <p className="contact-note">
              Vui lòng điền vào tất cả các trường được đánh dấu *.
            </p>

            <h3>Thông tin cá nhân</h3>

            <div className="two-cols">
              <input
                type="text"
                name="firstName"
                placeholder="Tên *"
                value={formData.firstName}
                onChange={handleChange}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Họ *"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>

            <h3>Thông tin liên hệ</h3>

            <input
              type="text"
              name="phone"
              placeholder="Số điện thoại *"
              value={formData.phone}
              onChange={handleChange}
            />

            <input
              type="email"
              name="email"
              placeholder="Email *"
              value={formData.email}
              onChange={handleChange}
            />

            <h3>Thông tin xe</h3>

            <div className="two-cols">
              <input
                type="text"
                value={car?.name || ""}
                disabled
                placeholder="Tên xe"
              />

              <select
                name="province"
                value={formData.province}
                onChange={handleChange}
              >
                <option value="Việt Nam">Việt Nam</option>
                <option value="TP.HCM">TP.HCM</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Cần Thơ">Cần Thơ</option>
              </select>
            </div>

            <h3>Yêu cầu báo giá</h3>

            <textarea
              name="additionalInfo"
              rows="5"
              placeholder="Ví dụ: Tôi muốn nhận báo giá lăn bánh, khuyến mãi hiện tại, hỗ trợ trả góp..."
              value={formData.additionalInfo}
              onChange={handleChange}
            ></textarea>

            <button type="submit" className="contact-submit-btn" disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi yêu cầu báo giá"}
            </button>

            {message && <p className="contact-message">{message}</p>}
          </form>
        </div>

        <div className="contact-right">
          <div className="car-preview-card">
            <img
              src={carImage}
              alt={car?.name}
              className="car-preview-image"
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/600x400?text=Image+Error";
              }}
            />

            <div className="car-preview-content">
              <p className="car-preview-label">Xe bạn đang quan tâm</p>
              <h2>{car?.name || "Đang tải..."}</h2>
              <p>{car?.brand || ""}</p>
              <p>
                {car?.price
                  ? `${Number(car.price).toLocaleString("vi-VN")}đ`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}