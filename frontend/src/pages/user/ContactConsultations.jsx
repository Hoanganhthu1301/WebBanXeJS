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

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchMyContacts();
  }, []);

  const fetchMyContacts = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await axios.get("http://localhost:5000/api/contacts");
      let data = res.data?.contacts || [];

      if (user) {
        data = data.filter((item) => {
          const sameEmail =
            user.email &&
            item.email &&
            user.email.toLowerCase() === item.email.toLowerCase();

          const samePhone =
            user.phone &&
            item.phone &&
            user.phone.trim() === item.phone.trim();

          return sameEmail || samePhone;
        });
      }

      setContacts(data);
    } catch (error) {
      setMessage("Không tải được danh sách yêu cầu tư vấn");
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

  return (
    <>
      <MainNavbar />

      <div className="contact-consultations-page">
        <div className="contact-consultations-container">
          <div className="contact-consultations-header">
            <p className="contact-consultations-subtitle">MY CONSULTATIONS</p>
            <h1>Yêu cầu tư vấn của tôi</h1>
            <p className="contact-consultations-desc">
              Danh sách các yêu cầu tư vấn bạn đã gửi cho showroom.
            </p>
          </div>

          {loading ? (
            <div className="contact-consultations-state">Đang tải dữ liệu...</div>
          ) : message ? (
            <div className="contact-consultations-state error">{message}</div>
          ) : contacts.length === 0 ? (
            <div className="contact-consultations-empty">
              <h3>Chưa có yêu cầu tư vấn nào</h3>
              <p>Hãy vào trang chi tiết xe để gửi yêu cầu tư vấn.</p>
            </div>
          ) : (
            <div className="contact-consultations-grid">
              {contacts.map((item) => (
                <div className="consultation-card" key={item._id}>
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
                      className={`consultation-status ${
                        item.status === "contacted" ? "done" : "new"
                      }`}
                    >
                      {item.status === "contacted" ? "Đã liên hệ" : "Mới"}
                    </span>
                  </div>

                  <div className="consultation-card-body">
                    <h3>{item.carName || "Xe quan tâm"}</h3>

                    <div className="consultation-meta">
                      <div>
                        <strong>Họ tên:</strong>{" "}
                        {[item.salutation, item.firstName, item.lastName]
                          .filter(Boolean)
                          .join(" ")}
                      </div>
                      <div>
                        <strong>SĐT:</strong> {item.phone || "—"}
                      </div>
                      <div>
                        <strong>Email:</strong> {item.email || "—"}
                      </div>
                      <div>
                        <strong>Ưu tiên:</strong>{" "}
                        {item.preferredContact === "email" ? "Email" : "Gọi điện"}
                      </div>
                      <div>
                        <strong>Ngân sách:</strong> {item.budget || "—"}
                      </div>
                      <div>
                        <strong>Số km:</strong> {item.mileage || "—"}
                      </div>
                      <div>
                        <strong>Năm xe:</strong> {item.year || "—"}
                      </div>
                      <div>
                        <strong>Lý do:</strong> {item.reason || "—"}
                      </div>
                    </div>

                    <div className="consultation-extra">
                      <strong>Thông tin bổ sung:</strong>
                      <p>{item.additionalInfo || "Không có"}</p>
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