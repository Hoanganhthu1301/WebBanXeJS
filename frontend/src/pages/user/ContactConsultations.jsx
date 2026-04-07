import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MainNavbar from "../../components/MainNavbar";
import { useTranslation } from 'react-i18next';
import "../../styles/user/ContactConsultations.css";
import PageLoader from "../../components/PageLoader";

export default function ContactConsultations() {
  const { t } = useTranslation();
  
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

      // Gom 3 loại yêu cầu từ 3 API khác nhau của Thư
      const results = await Promise.allSettled([
        axios.get("https://webbanxe-backend-stx9.onrender.com/api/contacts"),
        axios.get("https://webbanxe-backend-stx9.onrender.com/api/quotations"),
        axios.get("https://webbanxe-backend-stx9.onrender.com/api/appointments"),
      ]);

      const contactRes = results[0].status === "fulfilled" ? results[0].value.data : { contacts: [] };
      const quotationRes = results[1].status === "fulfilled" ? results[1].value.data : { quotations: [] };
      const appointmentRes = results[2].status === "fulfilled" ? results[2].value.data : { appointments: [] };

      let contacts = (contactRes.contacts || []).map((item) => ({
        ...item,
        requestType: "consultation",
        requestTypeLabel: t('type_consultation'),
      }));

      let quotations = (quotationRes.quotations || []).map((item) => ({
        ...item,
        requestType: "quotation",
        requestTypeLabel: t('type_quotation'),
      }));

      let appointments = (appointmentRes.appointments || []).map((item) => ({
        ...item,
        requestType: item.type === "test_drive" ? "test_drive" : "view",
        requestTypeLabel: item.type === "test_drive" ? t('type_test_drive') : t('type_view_car'),
      }));

      let merged = [...contacts, ...quotations, ...appointments];
      
      // Sắp xếp theo thời gian mới nhất
      merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setRequests(merged);
    } catch (error) {
      setMessage(t('error_fetch_requests'));
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
    const status = item.status;
    if (item.requestType === "consultation") {
      if (status === "processing") return t('status_processing');
      if (status === "contacted") return t('status_contacted');
      return t('status_new');
    }
    if (item.requestType === "quotation") {
      if (status === "quoted") return t('status_quoted');
      if (status === "done") return t('status_done');
      return t('status_new');
    }
    if (status === "confirmed") return t('status_confirmed');
    if (status === "done") return t('status_done');
    if (status === "cancelled") return t('status_cancelled');
    return t('status_pending_confirm');
  };

  const getStatusClass = (item) => {
    const status = item.status;
    if (status === "done" || status === "contacted" || status === "quoted") return "done";
    if (status === "processing" || status === "confirmed") return "processing";
    if (status === "cancelled") return "cancelled";
    return "new";
  };
  if (loading) return <PageLoader />;
  return (
    <>
      <MainNavbar />
      <div className="contact-consultations-page">
        <div className="contact-consultations-container">
          <div className="contact-consultations-header">
            <p className="contact-consultations-subtitle">{t('my_requests_subtitle')}</p>
            <h1>{t('my_requests_title')}</h1>
            <p className="contact-consultations-desc">{t('my_requests_desc')}</p>
          </div>

          { message ? (
            <div className="contact-consultations-state error">{message}</div>
          ) : requests.length === 0 ? (
            <div className="contact-consultations-empty">
              <h3>{t('requests_empty_title')}</h3>
              <p>{t('requests_empty_desc')}</p>
            </div>
          ) : (
            <div className="contact-consultations-grid">
              {requests.map((item) => (
                <div className="consultation-card" key={`${item.requestType}-${item._id}`}>
                  <div className="consultation-card-image-wrap">
                    <img src={getThumb(item)} alt={item.carName} className="consultation-card-image" />
                    <span className={`consultation-status ${getStatusClass(item)}`}>
                      {getStatusLabel(item)}
                    </span>
                  </div>

                  <div className="consultation-card-body">
                    <div style={{ marginBottom: 8, color: "#60a5fa", fontWeight: 700 }}>
                      {item.requestTypeLabel}
                    </div>
                    <h3>{item.carName || t('car_unknown')}</h3>

                    <div className="consultation-meta">
                      <div><strong>{t('field_phone')}:</strong> {item.phone || "—"}</div>
                      <div><strong>{t('field_email')}:</strong> {item.email || "—"}</div>
                      {item.province && (
                        <div><strong>{t('field_area')}:</strong> {item.province}</div>
                      )}

                      {(item.requestType === "view" || item.requestType === "test_drive") && (
                        <>
                          <div><strong>{t('field_date')}:</strong> {item.appointmentDate || "—"}</div>
                          <div><strong>{t('field_time')}:</strong> {item.appointmentTime || "—"}</div>
                          <div><strong>{t('field_location')}:</strong> {item.location || "—"}</div>
                        </>
                      )}
                    </div>

                    <div className="consultation-extra">
                      <strong>{t('field_content')}:</strong>
                      <p>{item.additionalInfo || t('no_content')}</p>
                    </div>

                    <div className="consultation-extra">
                      <strong>{t('field_admin_reply')}:</strong>
                      <p>{item.adminReply || t('no_admin_reply')}</p>
                    </div>

                    <div className="consultation-footer">
                      {t('sent_at')}: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
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