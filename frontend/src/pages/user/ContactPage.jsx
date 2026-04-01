import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/user/ContactPage.css";
import MainNavbar from "../../components/MainNavbar";

const initialForm = {
  salutation: "",
  firstName: "",
  lastName: "",
  company: "",
  street: "",
  district: "",
  zipCode: "",
  city: "",
  preferredContact: "call",
  phone: "",
  email: "",
  country: "Việt Nam",
  budget: "",
  mileage: "",
  year: "",
  reason: "",
  additionalInfo: "",
};

export default function ContactPage() {
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
      const res = await axios.get(`http://localhost:5000/api/cars/${id}`);
      setCar(res.data.car);
    } catch (error) {
      setMessage("Không lấy được thông tin xe");
    }
  };
  useEffect(() => {
  if (car) {
    setFormData((prev) => ({
      ...prev,
      budget: car.price ? String(car.price) : "",
      mileage: car.mileage ? String(car.mileage) : "",
      year: car.year ? String(car.year) : "",
    }));
  }
}, [car]);

  const carImage = useMemo(() => {
    if (!car) return "https://via.placeholder.com/600x400?text=No+Image";
    if (car.image && car.image.trim() !== "") return car.image;
    if (Array.isArray(car.images) && car.images.length > 0) return car.images[0];
    return "https://via.placeholder.com/600x400?text=No+Image";
  }, [car]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "radio" ? value : checked ? value : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!car?._id) {
      setMessage("Không xác định được xe đang quan tâm");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const payload = {
        ...formData,
        carId: car._id,
      };

      const res = await axios.post("http://localhost:5000/api/contacts", payload);

      setMessage(res.data.message || "Gửi yêu cầu tư vấn thành công");
      setFormData(initialForm);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Gửi yêu cầu tư vấn thất bại"
      );
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
            Bạn có thắc mắc, yêu cầu hoặc đề xuất nào không? Chúng tôi rất mong
            nhận được phản hồi từ bạn.
          </p>

          <form className="contact-form" onSubmit={handleSubmit}>
            <p className="contact-note">
              Vui lòng điền vào tất cả các trường được đánh dấu *.
            </p>

            <h3>Thông tin cá nhân của bạn</h3>

            <select
              name="salutation"
              value={formData.salutation}
              onChange={handleChange}
            >
              <option value="">Salutation *</option>
              <option value="Mr.">Ông</option>
              <option value="Ms.">Bà</option>
              <option value="Mrs.">Cô</option>
            </select>

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

            <input
              type="text"
              name="company"
              placeholder="Công ty"
              value={formData.company}
              onChange={handleChange}
            />

            <div className="two-cols">
              <input
                type="text"
                name="street"
                placeholder="Đường"
                value={formData.street}
                onChange={handleChange}
              />
              <input
                type="text"
                name="district"
                placeholder="Quận/Huyện"
                value={formData.district}
                onChange={handleChange}
              />
            </div>

            <div className="two-cols">
              <input
                type="text"
                name="zipCode"
                placeholder="Zip code"
                value={formData.zipCode}
                onChange={handleChange}
              />
              <input
                type="text"
                name="city"
                placeholder="Thành phố"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <h3>Thông tin liên hệ của bạn</h3>

            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="preferredContact"
                  value="call"
                  checked={formData.preferredContact === "call"}
                  onChange={handleChange}
                />
                Gọi
              </label>

              <label>
                <input
                  type="radio"
                  name="preferredContact"
                  value="email"
                  checked={formData.preferredContact === "email"}
                  onChange={handleChange}
                />
                Email
              </label>
            </div>

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

            <h3>Thông tin xe của bạn</h3>

            <div className="two-cols">
            <input
                type="text"
                value={car?.name || ""}
                disabled
                placeholder="Tên xe"
            />

            <select
                name="country"
                value={formData.country}
                onChange={handleChange}
            >
                <option value="Việt Nam">Việt Nam</option>
                <option value="Thái Lan">Thái Lan</option>
                <option value="Singapore">Singapore</option>
            </select>
            </div>

            <input
            type="text"
            name="budget"
            placeholder="Số tiền/ngân sách (VNĐ)"
            value={
                formData.budget
                ? Number(formData.budget).toLocaleString("vi-VN")
                : ""
            }
            disabled
            />

            <div className="two-cols">
            <input
                type="text"
                name="mileage"
                placeholder="Mileage"
                value={formData.mileage}
                disabled
            />
            <input
                type="text"
                name="year"
                placeholder="Đời xe"
                value={formData.year}
                disabled
            />
            </div>

           <h3>Yêu cầu tư vấn</h3>
            <p className="contact-note">
              Vui lòng mô tả nhu cầu của bạn để chúng tôi hỗ trợ tốt nhất.
            </p>
            <textarea
                name="additionalInfo"
                rows="5"
                placeholder="Ví dụ: Tôi muốn tư vấn về giá lăn bánh, hỗ trợ trả góp, khuyến mãi hiện tại..."
                value={formData.additionalInfo}
                onChange={handleChange}
            ></textarea>

            <button type="submit" className="contact-submit-btn" disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi"}
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