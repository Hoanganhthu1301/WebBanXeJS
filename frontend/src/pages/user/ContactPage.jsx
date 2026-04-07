import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/user/ContactPage.css";
import MainNavbar from "../../components/MainNavbar";
import { useTranslation } from 'react-i18next';
import PageLoader from "../../components/PageLoader";


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
  reason: "Tư vấn chung", // Mặc định lý do
  additionalInfo: "",
};

export default function ContactPage() {
  const { id } = useParams();
  const { t } = useTranslation();

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
      setMessage(t('error_fetch_car_info'));
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
      setMessage(t('error_no_car_selected'));
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const payload = { ...formData, carId: car._id };
      const res = await axios.post("https://webbanxe-backend-stx9.onrender.com/api/contacts", payload);
      setMessage(res.data.message || t('msg_contact_success'));
      setFormData(initialForm);
    } catch (error) {
      setMessage(error.response?.data?.message || t('msg_contact_fail'));
    } finally {
      setLoading(false);
    }
  };

if (loading) return <PageLoader />;
  return (
    <div className="contact-page">
      <MainNavbar />

      <div className="contact-container">
        <div className="contact-left">
          <p className="contact-subtitle">{t('contact_intro_text')}</p>

          <form className="contact-form" onSubmit={handleSubmit}>
            <p className="contact-note">{t('contact_required_note')}</p>

            <h3>{t('contact_personal_info_title')}</h3>

            <select name="salutation" value={formData.salutation} onChange={handleChange}>
              <option value="">{t('label_salutation')} *</option>
              <option value="Mr.">{t('opt_mr')}</option>
              <option value="Ms.">{t('opt_ms')}</option>
              <option value="Mrs.">{t('opt_mrs')}</option>
            </select>

            <div className="two-cols">
              <input type="text" name="firstName" placeholder={`${t('field_first_name')} *`} value={formData.firstName} onChange={handleChange} />
              <input type="text" name="lastName" placeholder={`${t('field_last_name')} *`} value={formData.lastName} onChange={handleChange} />
            </div>

            <input type="text" name="company" placeholder={t('field_company')} value={formData.company} onChange={handleChange} />

            <div className="two-cols">
              <input type="text" name="street" placeholder={t('field_street')} value={formData.street} onChange={handleChange} />
              <input type="text" name="district" placeholder={t('field_district')} value={formData.district} onChange={handleChange} />
            </div>

            <div className="two-cols">
              <input type="text" name="zipCode" placeholder={t('field_zipcode')} value={formData.zipCode} onChange={handleChange} />
              <input type="text" name="city" placeholder={t('field_city')} value={formData.city} onChange={handleChange} />
            </div>

            <h3>{t('contact_method_title')}</h3>

            <div className="radio-group">
              <label>
                <input type="radio" name="preferredContact" value="call" checked={formData.preferredContact === "call"} onChange={handleChange} />
                {t('pref_call')}
              </label>
              <label>
                <input type="radio" name="preferredContact" value="email" checked={formData.preferredContact === "email"} onChange={handleChange} />
                {t('pref_email')}
              </label>
            </div>

            <input type="text" name="phone" placeholder={`${t('field_phone')} *`} value={formData.phone} onChange={handleChange} />
            <input type="email" name="email" placeholder={`${t('field_email')} *`} value={formData.email} onChange={handleChange} />

            <h3>{t('contact_car_info_title')}</h3>

            <div className="two-cols">
              <input type="text" value={car?.name || ""} disabled placeholder={t('field_car_name')} />
              <select name="country" value={formData.country} onChange={handleChange}>
                <option value="Việt Nam">Việt Nam</option>
                <option value="Thái Lan">Thái Lan</option>
                <option value="Singapore">Singapore</option>
              </select>
            </div>

            <input type="text" name="budget" placeholder={t('field_budget')} value={formData.budget ? Number(formData.budget).toLocaleString("vi-VN") + "đ" : ""} disabled />

            <div className="two-cols">
              <input type="text" name="mileage" placeholder={t('field_mileage')} value={formData.mileage} disabled />
              <input type="text" name="year" placeholder={t('field_year')} value={formData.year} disabled />
            </div>

            <h3>{t('contact_request_title')}</h3>
            <p className="contact-note">{t('contact_request_note')}</p>
            <textarea name="additionalInfo" rows="5" placeholder={t('placeholder_additional_info')} value={formData.additionalInfo} onChange={handleChange}></textarea>

            <button type="submit" className="contact-submit-btn" disabled={loading}>
              {loading ? t('btn_sending') : t('btn_send')}
            </button>

            {message && <p className="contact-message">{message}</p>}
          </form>
        </div>

        <div className="contact-right">
          <div className="car-preview-card">
            <img src={carImage} alt={car?.name} className="car-preview-image" />
            <div className="car-preview-content">
              <p className="car-preview-label">{t('car_of_interest_label')}</p>
              <h2>{car?.name || t('loading')}</h2>
              <p>{car?.brand || ""}</p>
              <p>{car?.price ? `${Number(car.price).toLocaleString("vi-VN")}đ` : ""}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}