import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import "../../styles/user/ContactPage.css";
import MainNavbar from "../../components/MainNavbar";

const initialForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  type: "view",
  appointmentDate: "",
  appointmentTime: "",
  location: "",
  additionalInfo: "",
};

export default function AppointmentPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const [car, setCar] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCar();
  }, [id]);

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "test_drive") {
      setFormData((prev) => ({ ...prev, type: "test_drive" }));
    } else {
      setFormData((prev) => ({ ...prev, type: "view" }));
    }
  }, [searchParams]);

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

      const res = await axios.post("https://webbanxe-backend-stx9.onrender.com/api/appointments", payload);
      setMessage(res.data.message || "Đặt lịch thành công");
      setFormData({
        ...initialForm,
        type: formData.type,
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Đặt lịch thất bại");
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
            Đặt lịch xem xe hoặc lái thử để chúng tôi hỗ trợ bạn tốt hơn.
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

            <h3>Thông tin lịch hẹn</h3>

            <select name="type" value={formData.type} onChange={handleChange}>
              <option value="view">Đặt lịch xem xe</option>
              <option value="test_drive">Đặt lịch lái thử</option>
            </select>

            <input
              type="text"
              value={car?.name || ""}
              disabled
              placeholder="Tên xe"
            />

            <div className="two-cols">
              <input
                type="date"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleChange}
              />
              <input
                type="time"
                name="appointmentTime"
                value={formData.appointmentTime}
                onChange={handleChange}
              />
            </div>

            <input
              type="text"
              name="location"
              placeholder="Địa điểm / showroom *"
              value={formData.location}
              onChange={handleChange}
            />

            <textarea
              name="additionalInfo"
              rows="5"
              placeholder="Thông tin bổ sung"
              value={formData.additionalInfo}
              onChange={handleChange}
            ></textarea>

            <button type="submit" className="contact-submit-btn" disabled={loading}>
              {loading ? "Đang gửi..." : "Đặt lịch"}
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