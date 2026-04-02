import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MainNavbar from "../../components/MainNavbar";
import { useTranslation } from 'react-i18next';
import "../../styles/user/ContactConsultations.css";

export default function ContactConsultations() {
  const { t } = useTranslation();
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
            <p className="contact-consultations-subtitle">{t('consultations_subtitle')}</p>
            <h1>{t('consultations_title')}</h1>
            <p className="contact-consultations-desc">
              {t('consultations_desc')}
            </p>
          </div>

          {(() => {
            if (loading) return <div className="contact-consultations-state">{t('loading')}</div>;
            if (message) return <div className="contact-consultations-state error">{message}</div>;
            if (contacts.length === 0)
              return (
                <div className="contact-consultations-empty">
                  <h3>{t('consultations_empty_title')}</h3>
                  <p>{t('consultations_empty_desc')}</p>
                </div>
              );

            return (
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
                        {item.status === "contacted" ? t('consultation_status_contacted') : t('consultation_status_new')}
                      </span>
                    </div>

                    <div className="consultation-card-body">
                      <h3>{item.carName || t('car_unknown')}</h3>

                      <div className="consultation-meta">
                        <div>
                          <strong>{t('field_name')}:</strong>{" "}
                          {[item.salutation, item.firstName, item.lastName]
                            .filter(Boolean)
                            .join(" ")}
                        </div>
                        <div>
                          <strong>{t('field_phone')}:</strong> {item.phone || t('dash')}
                        </div>
                        <div>
                          <strong>{t('field_email')}:</strong> {item.email || t('dash')}
                        </div>
                        <div>
                          <strong>{t('field_preference')}:</strong> {item.preferredContact === "email" ? t('pref_email') : t('pref_phone')}
                        </div>
                        <div>
                          <strong>{t('field_budget')}:</strong> {item.budget || t('dash')}
                        </div>
                        <div>
                          <strong>{t('field_mileage')}:</strong> {item.mileage || t('dash')}
                        </div>
                        <div>
                          <strong>{t('field_year')}:</strong> {item.year || t('dash')}
                        </div>
                        <div>
                          <strong>{t('field_reason')}:</strong> {item.reason || t('dash')}
                        </div>
                      </div>

                      <div className="consultation-extra">
                        <strong>{t('extra_info')}:</strong>
                        <p>{item.additionalInfo || t('no_data')}</p>
                      </div>

                      <div className="consultation-footer">
                        {t('sent_at')}: {item.createdAt ? new Date(item.createdAt).toLocaleString() : t('dash')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}