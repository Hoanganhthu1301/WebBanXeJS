import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/user/DepositPage.css";
import MainNavbar from "../../components/MainNavbar";

const formatPrice = (value) => {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
};

const getMinPickupDate = () => {
  const today = new Date();
  today.setDate(today.getDate() + 7);

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const showroomSlots = [
  "08:00-10:00",
  "10:00-12:00",
  "13:00-15:00",
  "15:00-17:00",
];

const deliverySlots = ["08:00-12:00", "13:00-17:00"];

export default function DepositPage() {
  const { id } = useParams();

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, []);

  const minPickupDate = useMemo(() => getMinPickupDate(), []);

  const [car, setCar] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || currentUser?.name || "",
    phone: currentUser?.phone || "",
    email: currentUser?.email || "",
    depositAmount: "",
    pickupDate: "",
    pickupTimeSlot: "",
    deliveryMethod: "showroom",
    showroom: "Showroom TP.HCM",
    deliveryAddress: "",
    note: "",
  });

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

  const carImage = useMemo(() => {
    if (!car) return "https://via.placeholder.com/600x400?text=No+Image";
    if (car.image && car.image.trim() !== "") return car.image;
    if (Array.isArray(car.images) && car.images.length > 0) return car.images[0];
    return "https://via.placeholder.com/600x400?text=No+Image";
  }, [car]);

  const carPrice = useMemo(() => Number(car?.price || 0), [car]);

  const minimumDeposit = useMemo(() => {
    if (!carPrice) return 0;
    return Math.ceil(carPrice * 0.05);
  }, [carPrice]);

  const vatAmount = useMemo(() => Math.round(carPrice * 0.1), [carPrice]);
  const registrationFee = useMemo(() => Math.round(carPrice * 0.1), [carPrice]);
  const licensePlateFee = 20000000;
  const insuranceFee = 1560000;

  const totalEstimatedPrice = useMemo(() => {
    return carPrice + vatAmount + registrationFee + licensePlateFee + insuranceFee;
  }, [carPrice, vatAmount, registrationFee]);

  useEffect(() => {
    setFormData((prev) => {
      const current = Number(prev.depositAmount || 0);
      if (current >= minimumDeposit) return prev;
      return {
        ...prev,
        depositAmount: String(minimumDeposit),
      };
    });
  }, [minimumDeposit]);

  const depositInput = Number(formData.depositAmount || 0);
  const remainingAmount = Math.max(totalEstimatedPrice - depositInput, 0);

  const carStatusText = useMemo(() => {
    if (!car?.status) return "Đang cập nhật";
    if (car.status === "available") return "Đang bán";
    if (car.status === "reserved") return "Đang giữ chỗ";
    if (car.status === "sold") return "Đã bán";
    return "Ẩn";
  }, [car]);

  const activeSlots = useMemo(() => {
    return formData.deliveryMethod === "home_delivery" ? deliverySlots : showroomSlots;
  }, [formData.deliveryMethod]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (name === "deliveryMethod") {
        next.pickupTimeSlot = "";
        if (value === "showroom") {
          next.deliveryAddress = "";
          if (!next.showroom) next.showroom = "Showroom TP.HCM";
        } else {
          next.showroom = "";
        }
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!car?._id) {
      setMessage("Không xác định được xe");
      return;
    }

    if (!formData.fullName || !formData.phone) {
      setMessage("Vui lòng nhập họ tên và số điện thoại");
      return;
    }

    if (!formData.pickupDate) {
      setMessage("Vui lòng chọn ngày nhận xe");
      return;
    }

    if (formData.pickupDate < minPickupDate) {
      setMessage("Ngày nhận xe phải sau hôm nay ít nhất 7 ngày");
      return;
    }

    if (!formData.pickupTimeSlot) {
      setMessage("Vui lòng chọn khung giờ nhận xe");
      return;
    }

    if (formData.deliveryMethod === "showroom" && !formData.showroom.trim()) {
      setMessage("Vui lòng nhập showroom nhận xe");
      return;
    }

    if (
      formData.deliveryMethod === "home_delivery" &&
      !formData.deliveryAddress.trim()
    ) {
      setMessage("Vui lòng nhập địa chỉ giao tận nhà");
      return;
    }

    if (Number(formData.depositAmount) < minimumDeposit) {
      setMessage(`Tiền cọc tối thiểu là ${formatPrice(minimumDeposit)}`);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const payload = {
        carId: car._id,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        depositAmount: Number(formData.depositAmount),
        pickupDate: formData.pickupDate,
        pickupTimeSlot: formData.pickupTimeSlot,
        deliveryMethod: formData.deliveryMethod,
        showroom: formData.showroom,
        deliveryAddress: formData.deliveryAddress,
        note: formData.note,
      };

      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:5000/api/deposits/payos",
        payload,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }

      setMessage("Không nhận được link thanh toán");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Không tạo được thanh toán đặt cọc"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!car && !message) {
    return <p style={{ padding: 30 }}>Đang tải dữ liệu...</p>;
  }

  return (
    <div className="deposit-page">
      <MainNavbar />

      <div className="deposit-container">
        <div className="deposit-left">
          <h1>Đặt cọc giữ xe</h1>
          <p className="deposit-desc">
            Hoàn tất thông tin bên dưới để tạo link thanh toán cọc qua payOS,
            giữ chỗ chiếc xe bạn đang quan tâm và đặt lịch nhận xe dự kiến.
          </p>

          <div className="deposit-note-box">
            <p>
              <strong>Mức cọc tối thiểu:</strong> {formatPrice(minimumDeposit)}
            </p>
            <p>
              <strong>Tỷ lệ cọc:</strong> 5% giá trị xe
            </p>
            <p>
              <strong>Ngày nhận xe sớm nhất:</strong> {minPickupDate}
            </p>
            <p>
              <strong>Lưu ý:</strong> Nếu bạn chọn nhận tại showroom, khung giờ đã
              có người đặt sẽ không thể chọn tiếp.
            </p>
          </div>

          {car?.status === "reserved" && (
            <p className="deposit-warning">Xe này hiện đang được giữ chỗ.</p>
          )}

          {car?.status === "sold" && (
            <p className="deposit-warning">Xe này đã bán.</p>
          )}

          <form className="deposit-form" onSubmit={handleSubmit}>
            <h3 className="deposit-section-title">Thông tin khách hàng</h3>

            <input
              type="text"
              name="fullName"
              placeholder="Họ và tên"
              value={formData.fullName}
              onChange={handleChange}
            />

            <div className="deposit-grid-2">
              <input
                type="text"
                name="phone"
                placeholder="Số điện thoại"
                value={formData.phone}
                onChange={handleChange}
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <h3 className="deposit-section-title">Thông tin đặt cọc</h3>

            <input
              type="number"
              name="depositAmount"
              min={minimumDeposit}
              placeholder="Số tiền đặt cọc"
              value={formData.depositAmount}
              onChange={handleChange}
            />

            <div className="deposit-highlight-box">
              <p>
                <strong>Số tiền cọc đang chọn:</strong>{" "}
                {formatPrice(depositInput || minimumDeposit)}
              </p>
              <p>
                <strong>Số tiền còn lại sau khi cọc:</strong>{" "}
                {formatPrice(remainingAmount)}
              </p>
            </div>

            <h3 className="deposit-section-title">Lịch nhận xe</h3>

            <select
              name="deliveryMethod"
              value={formData.deliveryMethod}
              onChange={handleChange}
            >
              <option value="showroom">Nhận tại showroom</option>
              <option value="home_delivery">Giao tận nhà</option>
            </select>

            <div className="deposit-grid-2">
              <input
                type="date"
                name="pickupDate"
                min={minPickupDate}
                value={formData.pickupDate}
                onChange={handleChange}
              />

              <select
                name="pickupTimeSlot"
                value={formData.pickupTimeSlot}
                onChange={handleChange}
              >
                <option value="">Chọn khung giờ</option>
                {activeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            {formData.deliveryMethod === "showroom" ? (
              <input
                type="text"
                name="showroom"
                placeholder="Showroom nhận xe"
                value={formData.showroom}
                onChange={handleChange}
              />
            ) : (
              <textarea
                rows="3"
                name="deliveryAddress"
                placeholder="Địa chỉ giao tận nhà"
                value={formData.deliveryAddress}
                onChange={handleChange}
              ></textarea>
            )}

            <textarea
              rows="5"
              name="note"
              placeholder="Ghi chú thêm cho admin, ví dụ: muốn xem xe cuối tuần, cần tư vấn thủ tục, cần giao tận nhà..."
              value={formData.note}
              onChange={handleChange}
            ></textarea>

            <button
              type="submit"
              disabled={
                loading || car?.status === "reserved" || car?.status === "sold"
              }
            >
              {loading ? "Đang tạo thanh toán..." : "Thanh toán cọc với payOS"}
            </button>

            {message && <p className="deposit-message">{message}</p>}
          </form>
        </div>

        <div className="deposit-right">
          <div className="deposit-car-card">
            <img
              src={carImage}
              alt={car?.name}
              className="deposit-car-image"
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/600x400?text=Image+Error";
              }}
            />

            <div className="deposit-car-content">
              <p className="deposit-car-label">Chi tiết đơn đặt cọc</p>
              <h2>{car?.name || "Đang tải..."}</h2>

              <div className="deposit-summary">
                <p>
                  <strong>Hãng xe:</strong> {car?.brand || "Đang cập nhật"}
                </p>
                <p>
                  <strong>Giá xe niêm yết:</strong> {formatPrice(carPrice)}
                </p>
                <p>
                  <strong>Trạng thái xe:</strong> {carStatusText}
                </p>
                <p>
                  <strong>Tỷ lệ cọc:</strong> 5%
                </p>
                <p>
                  <strong>Số tiền cọc tối thiểu:</strong> {formatPrice(minimumDeposit)}
                </p>
              </div>

              <div className="deposit-price-box">
                <h3>Chi tiết thanh toán dự kiến</h3>

                <div className="deposit-price-row">
                  <span>Giá xe</span>
                  <strong>{formatPrice(carPrice)}</strong>
                </div>

                <div className="deposit-price-row">
                  <span>VAT (10%)</span>
                  <strong>{formatPrice(vatAmount)}</strong>
                </div>

                <div className="deposit-price-row">
                  <span>Phí trước bạ (10%)</span>
                  <strong>{formatPrice(registrationFee)}</strong>
                </div>

                <div className="deposit-price-row">
                  <span>Phí biển số</span>
                  <strong>{formatPrice(licensePlateFee)}</strong>
                </div>

                <div className="deposit-price-row">
                  <span>Bảo hiểm dân sự</span>
                  <strong>{formatPrice(insuranceFee)}</strong>
                </div>

                <div className="deposit-price-row total">
                  <span>Tổng chi phí dự kiến</span>
                  <strong>{formatPrice(totalEstimatedPrice)}</strong>
                </div>

                <div className="deposit-price-row paid">
                  <span>Tiền cọc</span>
                  <strong>{formatPrice(depositInput || minimumDeposit)}</strong>
                </div>

                <div className="deposit-price-row remain">
                  <span>Còn phải thanh toán</span>
                  <strong>{formatPrice(remainingAmount)}</strong>
                </div>
              </div>

              <div className="deposit-highlight-box">
                <p>
                  <strong>Ngày nhận xe:</strong>{" "}
                  {formData.pickupDate || "Chưa chọn"}
                </p>
                <p>
                  <strong>Khung giờ:</strong>{" "}
                  {formData.pickupTimeSlot || "Chưa chọn"}
                </p>
                <p>
                  <strong>Hình thức nhận:</strong>{" "}
                  {formData.deliveryMethod === "home_delivery"
                    ? "Giao tận nhà"
                    : "Nhận tại showroom"}
                </p>
                <p>
                  <strong>
                    {formData.deliveryMethod === "home_delivery"
                      ? "Địa chỉ giao:"
                      : "Showroom:"}
                  </strong>{" "}
                  {formData.deliveryMethod === "home_delivery"
                    ? formData.deliveryAddress || "Chưa nhập"
                    : formData.showroom || "Chưa nhập"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}