import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/user/DepositPage.css";
import MainNavbar from "../../components/MainNavbar";
import { useTranslation } from "react-i18next";
import PageLoader from "../../components/PageLoader";

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

const bankOptions = [
  { bin: "970422", name: "MB Bank" },
  { bin: "970436", name: "Vietcombank" },
  { bin: "970418", name: "BIDV" },
  { bin: "970407", name: "Techcombank" },
  { bin: "970415", name: "VietinBank" },
  { bin: "970432", name: "VPBank" },
  { bin: "970423", name: "TPBank" },
  { bin: "970403", name: "Sacombank" },
  { bin: "970437", name: "HDBank" },
  { bin: "970405", name: "Agribank" },
  { bin: "970448", name: "OCB" },
  { bin: "970416", name: "ACB" },
  { bin: "970431", name: "Eximbank" },
  { bin: "970443", name: "SHB" },
  { bin: "970438", name: "BaoViet Bank" },
];

export default function DepositPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();

  const formatPrice = (value) => {
    const locale = i18n.language === "en" ? "en-US" : "vi-VN";
    return `${Number(value || 0).toLocaleString(locale)}đ`;
  };

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

  const [promotions, setPromotions] = useState([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState("");

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
    refundBankBin: "",
    refundBankAccountNumber: "",
    refundBankAccountName: "",
  });

  useEffect(() => {
    fetchCar();
  }, [id]);

  useEffect(() => {
    if (car?._id) {
      fetchPromotionsByCar(car._id);
    }
  }, [car?._id]);

  const fetchCar = async () => {
    try {
      const res = await axios.get(
        `https://webbanxe-backend-stx9.onrender.com/api/cars/${id}`
      );
      setCar(res.data.car);
    } catch {
      setMessage(t("deposit_fetch_car_error"));
    }
  };

  const fetchPromotionsByCar = async (carId) => {
    try {
      const res = await axios.get(
        `https://webbanxe-backend-stx9.onrender.com/api/promotions/car/${carId}`
      );
      setPromotions(res.data.promotions || []);
    } catch (error) {
      console.log("Lỗi lấy voucher:", error);
      setPromotions([]);
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

  const selectedPromotion = useMemo(() => {
    return promotions.find((item) => item._id === selectedPromotionId) || null;
  }, [promotions, selectedPromotionId]);

  const discountAmount = useMemo(() => {
    if (!selectedPromotion) return 0;

    if (selectedPromotion.type === "amount") {
      return Number(selectedPromotion.value || 0);
    }

    if (selectedPromotion.type === "percent") {
      return Math.round((carPrice * Number(selectedPromotion.value || 0)) / 100);
    }

    return 0;
  }, [selectedPromotion, carPrice]);

  const finalEstimatedPrice = useMemo(() => {
    return Math.max(totalEstimatedPrice - discountAmount, 0);
  }, [totalEstimatedPrice, discountAmount]);

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
  const remainingAmountAfterVoucher = Math.max(
    finalEstimatedPrice - depositInput,
    0
  );

  const carStatusText = useMemo(() => {
    if (!car?.status) return t("deposit_status_updating");
    if (car.status === "available") return t("deposit_status_available");
    if (car.status === "reserved") return t("deposit_status_reserved");
    if (car.status === "sold") return t("deposit_status_sold");
    return t("deposit_status_hidden");
  }, [car, t]);

  const activeSlots = useMemo(() => {
    return formData.deliveryMethod === "home_delivery"
      ? deliverySlots
      : showroomSlots;
  }, [formData.deliveryMethod]);

  const selectedRefundBankName = useMemo(() => {
    const found = bankOptions.find((bank) => bank.bin === formData.refundBankBin);
    return found ? found.name : t("deposit_not_selected");
  }, [formData.refundBankBin, t]);

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
      setMessage(t("deposit_invalid_car"));
      return;
    }

    if (!formData.fullName || !formData.phone) {
      setMessage(t("deposit_require_name_phone"));
      return;
    }

    if (!formData.refundBankBin) {
      setMessage(t("deposit_require_bank"));
      return;
    }

    if (!formData.refundBankAccountNumber.trim()) {
      setMessage(t("deposit_require_account_number"));
      return;
    }

    if (!formData.refundBankAccountName.trim()) {
      setMessage(t("deposit_require_account_name"));
      return;
    }

    if (!formData.pickupDate) {
      setMessage(t("deposit_require_pickup_date"));
      return;
    }

    if (formData.pickupDate < minPickupDate) {
      setMessage(t("deposit_pickup_date_invalid"));
      return;
    }

    if (!formData.pickupTimeSlot) {
      setMessage(t("deposit_require_pickup_slot"));
      return;
    }

    if (formData.deliveryMethod === "showroom" && !formData.showroom.trim()) {
      setMessage(t("deposit_require_showroom"));
      return;
    }

    if (
      formData.deliveryMethod === "home_delivery" &&
      !formData.deliveryAddress.trim()
    ) {
      setMessage(t("deposit_require_address"));
      return;
    }

    if (Number(formData.depositAmount) < minimumDeposit) {
      setMessage(
        t("deposit_min_error", { amount: formatPrice(minimumDeposit) })
      );
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
        refundBankBin: formData.refundBankBin,
        refundBankAccountNumber: formData.refundBankAccountNumber,
        refundBankAccountName: formData.refundBankAccountName,
        promotionId: selectedPromotionId || null,
      };

      const token = localStorage.getItem("token");

      const res = await axios.post(
        "https://webbanxe-backend-stx9.onrender.com/api/deposits/payos",
        payload,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }

      setMessage(t("deposit_no_checkout_url"));
    } catch (error) {
      setMessage(
        error.response?.data?.message || t("deposit_create_payment_error")
      );
    } finally {
      setLoading(false);
    }
  };

  if (!car && !message) {
    return <p style={{ padding: 30 }}>{t("deposit_loading")}</p>;
  }

  if (loading) return <PageLoader />;

  return (
    <div className="deposit-page">
      <MainNavbar />

      <div className="deposit-container">
        <div className="deposit-left">
          <h1>{t("deposit_page_title")}</h1>
          <p className="deposit-desc">{t("deposit_page_desc")}</p>

          <div className="deposit-note-box">
            <p>
              <strong>{t("deposit_minimum")}</strong> {formatPrice(minimumDeposit)}
            </p>
            <p>
              <strong>{t("deposit_rate")}</strong> {t("deposit_rate_value")}
            </p>
            <p>
              <strong>{t("deposit_earliest_pickup")}</strong> {minPickupDate}
            </p>
            <p>
              <strong>{t("deposit_note_label")}</strong> {t("deposit_note_text")}
            </p>
          </div>

          {car?.status === "reserved" && (
            <p className="deposit-warning">{t("deposit_car_reserved")}</p>
          )}

          {car?.status === "sold" && (
            <p className="deposit-warning">{t("deposit_car_sold")}</p>
          )}

          <form className="deposit-form" onSubmit={handleSubmit}>
            <h3 className="deposit-section-title">{t("deposit_customer_info")}</h3>

            <input
              type="text"
              name="fullName"
              placeholder={t("deposit_placeholder_fullname")}
              value={formData.fullName}
              onChange={handleChange}
            />

            <div className="deposit-grid-2">
              <input
                type="text"
                name="phone"
                placeholder={t("deposit_placeholder_phone")}
                value={formData.phone}
                onChange={handleChange}
              />

              <input
                type="email"
                name="email"
                placeholder={t("deposit_placeholder_email")}
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <h3 className="deposit-section-title">{t("deposit_refund_info")}</h3>

            <div className="deposit-grid-2">
              <select
                name="refundBankBin"
                value={formData.refundBankBin}
                onChange={handleChange}
              >
                <option value="">{t("deposit_placeholder_refund_bank")}</option>
                {bankOptions.map((bank) => (
                  <option key={bank.bin} value={bank.bin}>
                    {bank.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                name="refundBankAccountNumber"
                placeholder={t("deposit_placeholder_refund_account_number")}
                value={formData.refundBankAccountNumber}
                onChange={handleChange}
              />
            </div>

            <input
              type="text"
              name="refundBankAccountName"
              placeholder={t("deposit_placeholder_refund_account_name")}
              value={formData.refundBankAccountName}
              onChange={handleChange}
            />

            <h3 className="deposit-section-title">{t("deposit_order_info")}</h3>

            <input
              type="number"
              name="depositAmount"
              min={minimumDeposit}
              placeholder={t("deposit_placeholder_amount")}
              value={formData.depositAmount}
              onChange={handleChange}
            />

            <div className="deposit-highlight-box">
              <p>
                <strong>{t("deposit_selected_amount")}</strong>{" "}
                {formatPrice(depositInput || minimumDeposit)}
              </p>
              <p>
                <strong>{t("deposit_remaining_after_deposit")}</strong>{" "}
                {formatPrice(remainingAmountAfterVoucher)}
              </p>
            </div>

            <h3 className="deposit-section-title">{t("deposit_voucher_title")}</h3>

            <select
              value={selectedPromotionId}
              onChange={(e) => setSelectedPromotionId(e.target.value)}
            >
              <option value="">{t("deposit_placeholder_no_voucher")}</option>
              {promotions.map((promo) => (
                <option key={promo._id} value={promo._id}>
                  {promo.title}{" "}
                  {promo.type === "amount"
                    ? `- ${Number(promo.value || 0).toLocaleString(
                        i18n.language === "en" ? "en-US" : "vi-VN"
                      )}đ`
                    : `- ${promo.value || 0}%`}
                </option>
              ))}
            </select>

            {selectedPromotion && (
              <div className="deposit-highlight-box">
                <p>
                  <strong>{t("deposit_selected_voucher")}</strong>{" "}
                  {selectedPromotion.title}
                </p>
                <p>
                  <strong>{t("deposit_discount")}</strong>{" "}
                  {formatPrice(discountAmount)}
                </p>
              </div>
            )}

            <h3 className="deposit-section-title">{t("deposit_schedule_title")}</h3>

            <select
              name="deliveryMethod"
              value={formData.deliveryMethod}
              onChange={handleChange}
            >
              <option value="showroom">{t("deposit_delivery_showroom")}</option>
              <option value="home_delivery">{t("deposit_delivery_home")}</option>
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
                <option value="">{t("deposit_placeholder_pickup_slot")}</option>
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
                placeholder={t("deposit_placeholder_showroom")}
                value={formData.showroom}
                onChange={handleChange}
              />
            ) : (
              <textarea
                rows="3"
                name="deliveryAddress"
                placeholder={t("deposit_placeholder_address")}
                value={formData.deliveryAddress}
                onChange={handleChange}
              ></textarea>
            )}

            <textarea
              rows="5"
              name="note"
              placeholder={t("deposit_placeholder_note")}
              value={formData.note}
              onChange={handleChange}
            ></textarea>

            <button
              type="submit"
              disabled={
                loading || car?.status === "reserved" || car?.status === "sold"
              }
            >
              {loading ? t("deposit_submit_loading") : t("deposit_submit")}
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
              <p className="deposit-car-label">{t("deposit_detail_label")}</p>
              <h2>{car?.name || t("deposit_loading")}</h2>

              <div className="deposit-summary">
                <p>
                  <strong>{t("deposit_brand")}</strong>{" "}
                  {car?.brand || t("deposit_status_updating")}
                </p>
                <p>
                  <strong>{t("deposit_listed_price")}</strong> {formatPrice(carPrice)}
                </p>
                <p>
                  <strong>{t("deposit_car_status")}</strong> {carStatusText}
                </p>
                <p>
                  <strong>{t("deposit_rate")}</strong> {t("deposit_rate_value")}
                </p>
                <p>
                  <strong>{t("deposit_minimum")}</strong>{" "}
                  {formatPrice(minimumDeposit)}
                </p>
                <p>
                  <strong>{t("deposit_refund_bank")}</strong>{" "}
                  {selectedRefundBankName}
                </p>
                <p>
                  <strong>{t("deposit_applied_voucher")}</strong>{" "}
                  {selectedPromotion ? selectedPromotion.title : t("deposit_none")}
                </p>
              </div>

              <div className="deposit-price-box">
                <h3>{t("deposit_payment_detail_title")}</h3>

                <div className="deposit-price-row">
                  <span>{t("deposit_car_price")}</span>
                  <strong>{formatPrice(carPrice)}</strong>
                </div>

                <div className="deposit-price-row">
                  <span>{t("deposit_vat")}</span>
                  <strong>{formatPrice(vatAmount)}</strong>
                </div>

                <div className="deposit-price-row">
                  <span>{t("deposit_registration_fee")}</span>
                  <strong>{formatPrice(registrationFee)}</strong>
                </div>

                <div className="deposit-price-row">
                  <span>{t("deposit_license_fee")}</span>
                  <strong>{formatPrice(licensePlateFee)}</strong>
                </div>

                <div className="deposit-price-row">
                  <span>{t("deposit_insurance_fee")}</span>
                  <strong>{formatPrice(insuranceFee)}</strong>
                </div>

                <div className="deposit-price-row">
                  <span>{t("deposit_voucher_discount")}</span>
                  <strong>-{formatPrice(discountAmount)}</strong>
                </div>

                <div className="deposit-price-row total">
                  <span>{t("deposit_total_after_discount")}</span>
                  <strong>{formatPrice(finalEstimatedPrice)}</strong>
                </div>

                <div className="deposit-price-row paid">
                  <span>{t("deposit_paid_amount")}</span>
                  <strong>{formatPrice(depositInput || minimumDeposit)}</strong>
                </div>

                <div className="deposit-price-row remain">
                  <span>{t("deposit_remaining_payment")}</span>
                  <strong>{formatPrice(remainingAmountAfterVoucher)}</strong>
                </div>
              </div>

              <div className="deposit-highlight-box">
                <p>
                  <strong>{t("deposit_pickup_date")}</strong>{" "}
                  {formData.pickupDate || t("deposit_not_selected")}
                </p>
                <p>
                  <strong>{t("deposit_pickup_slot")}</strong>{" "}
                  {formData.pickupTimeSlot || t("deposit_not_selected")}
                </p>
                <p>
                  <strong>{t("deposit_delivery_method")}</strong>{" "}
                  {formData.deliveryMethod === "home_delivery"
                    ? t("deposit_delivery_home")
                    : t("deposit_delivery_showroom")}
                </p>
                <p>
                  <strong>
                    {formData.deliveryMethod === "home_delivery"
                      ? t("deposit_delivery_address")
                      : t("deposit_showroom")}
                  </strong>{" "}
                  {formData.deliveryMethod === "home_delivery"
                    ? formData.deliveryAddress || t("deposit_not_entered")
                    : formData.showroom || t("deposit_not_entered")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}