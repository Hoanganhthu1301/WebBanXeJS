import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MainNavbar from "../../components/MainNavbar";
import "../../styles/user/ContactConsultations.css";

export default function ContactConsultations() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, []);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      setMessage("");

      const results = await Promise.allSettled([
        axios.get("http://localhost:5000/api/contacts"),
        axios.get("http://localhost:5000/api/quotations"),
        axios.get("http://localhost:5000/api/appointments"),
      ]);

      const contactRes =
        results[0].status === "fulfilled" ? results[0].value.data : { contacts: [] };

      const quotationRes =
        results[1].status === "fulfilled"
          ? results[1].value.data
          : { quotations: [] };

      const appointmentRes =
        results[2].status === "fulfilled"
          ? results[2].value.data
          : { appointments: [] };

      let contacts = (contactRes.contacts || []).map((item) => ({
        ...item,
        requestType: "consultation",
        requestTypeLabel: "Tư vấn",
      }));

      let quotations = (quotationRes.quotations || []).map((item) => ({
        ...item,
        requestType: "quotation",
        requestTypeLabel: "Báo giá",
      }));

      let appointments = (appointmentRes.appointments || []).map((item) => ({
        ...item,
        requestType: item.type === "test_drive" ? "test_drive" : "view",
        requestTypeLabel: item.type === "test_drive" ? "Lái thử" : "Xem xe",
      }));

      let merged = [...contacts, ...quotations, ...appointments];

      // if (user) {
      //   merged = merged.filter((item) => {
      //     const sameEmail =
      //       user.email &&
      //       item.email &&
      //       user.email.toLowerCase() === item.email.toLowerCase();

      //     const samePhone =
      //       user.phone &&
      //       item.phone &&
      //       user.phone.trim() === item.phone.trim();

      //     return sameEmail || samePhone;
      //   });
      // }

      merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setRequests(merged);
    } catch (error) {
      setMessage("Không tải được danh sách yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  const getThumb = (item) => {
    const car = item.carId;
    if (!car) return "https://via.placeholder.com/320x200?text=No+Image";
    if (car.image && car.image.trim() !== "") return car.image;
    if (Array.isArray(car.images) && car.images.length > 0) return car.images[0];
    return "https://via.placeholder.com/320x200?text=No+Image";
  };

  const getStatusLabel = (item) => {
    if (item.requestType === "consultation") {
      if (item.status === "processing") return "Đang xử lý";
      if (item.status === "contacted") return "Đã liên hệ";
      return "Mới";
    }

    if (item.requestType === "quotation") {
      if (item.status === "quoted") return "Đã báo giá";
      if (item.status === "done") return "Hoàn tất";
      return "Mới";
    }

    if (item.status === "confirmed") return "Đã xác nhận";
    if (item.status === "done") return "Hoàn tất";
    if (item.status === "cancelled") return "Đã hủy";
    return "Chờ xác nhận";
  };

  const getStatusClass = (item) => {
    const status = item.status;

    if (status === "done" || status === "contacted" || status === "quoted") {
      return "done";
    }

    if (status === "processing" || status === "confirmed") {
      return "processing";
    }

    if (status === "cancelled") {
      return "cancelled";
    }

    return "new";
  };

  return (
    <>
      <MainNavbar />

      <div className="contact-consultations-page">
        <div className="contact-consultations-container">
          <div className="contact-consultations-header">
            <p className="contact-consultations-subtitle">MY REQUESTS</p>
            <h1>Yêu cầu của tôi</h1>
            <p className="contact-consultations-desc">
              Danh sách các yêu cầu bạn đã gửi và phản hồi từ showroom.
            </p>
          </div>

          {loading ? (
            <div className="contact-consultations-state">Đang tải dữ liệu...</div>
          ) : message ? (
            <div className="contact-consultations-state error">{message}</div>
          ) : requests.length === 0 ? (
            <div className="contact-consultations-empty">
              <h3>Chưa có yêu cầu nào</h3>
              <p>Hãy vào trang chi tiết xe để gửi yêu cầu tư vấn, báo giá hoặc đặt lịch.</p>
            </div>
          ) : (
            <div className="contact-consultations-grid">
              {requests.map((item) => (
                <div className="consultation-card" key={`${item.requestType}-${item._id}`}>
                  <div className="consultation-card-image-wrap">
                    <img
                      src={getThumb(item)}
                      alt={item.carName}
                      className="consultation-card-image"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/320x200?text=No+Image";
                      }}
                    />
                    <span
                      className={`consultation-status ${getStatusClass(item)}`}
                    >
                      {getStatusLabel(item)}
                    </span>
                  </div>

                  <div className="consultation-card-body">
                    <div style={{ marginBottom: 8, color: "#60a5fa", fontWeight: 700 }}>
                      {item.requestTypeLabel}
                    </div>

                    <h3>{item.carName || "Xe quan tâm"}</h3>

                    <div className="consultation-meta">
                      <div>
                        <strong>SĐT:</strong> {item.phone || "—"}
                      </div>
                      <div>
                        <strong>Email:</strong> {item.email || "—"}
                      </div>

                      {item.province && (
                        <div>
                          <strong>Khu vực:</strong> {item.province}
                        </div>
                      )}

                      {(item.requestType === "view" || item.requestType === "test_drive") && (
                        <>
                          <div>
                            <strong>Ngày hẹn:</strong> {item.appointmentDate || "—"}
                          </div>
                          <div>
                            <strong>Giờ hẹn:</strong> {item.appointmentTime || "—"}
                          </div>
                          <div>
                            <strong>Địa điểm:</strong> {item.location || "—"}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="consultation-extra">
                      <strong>Nội dung yêu cầu:</strong>
                      <p>{item.additionalInfo || "Không có"}</p>
                    </div>

                    <div className="consultation-extra">
                      <strong>Phản hồi từ showroom:</strong>
                      <p>{item.adminReply || "Chưa có phản hồi từ admin."}</p>
                    </div>

                    <div className="consultation-footer">
                      Gửi lúc:{" "}
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString("vi-VN")
                        : "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}