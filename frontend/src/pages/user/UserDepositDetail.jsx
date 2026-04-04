import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Car,
  CircleDollarSign,
  CreditCard,
  FileText,
  Phone,
  Receipt,
  ShieldCheck,
  User,
  Image as ImageIcon,
  Tag,
} from "lucide-react";
import MainNavbar from "../../components/MainNavbar";
import "../../styles/user/UserDepositDetail.css";
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = "https://webbanxe-backend-stx9.onrender.com/api";

export default function UserDepositDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();

  const hoaDonRef = useRef();

  const [deposit, setDeposit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(null);
  const [xuatDang, setXuatDang] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchDepositDetail();
  }, [id]);

  const fetchDepositDetail = async () => {
    try {
      setLoading(true);
      setMessage("");
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/deposits/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeposit(res.data?.deposit || null);
    } catch (error) {
      setMessage(error?.response?.data?.message || t('msg_fetch_deposit_detail_error'));
    } finally {
      setLoading(false);
    }
  };

  const xuatPDF = async () => {
    if (!hoaDonRef.current) return;
    try {
      setXuatDang(true);
      const canvas = await html2canvas(hoaDonRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`hoa-don-${deposit?._id}.pdf`);
    } catch (err) {
      alert('Xuất PDF thất bại, vui lòng thử lại!');
    } finally {
      setXuatDang(false);
    }
  };

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString("vi-VN") + "đ";
  };

  const hasVoucher = () => {
    return (
      deposit?.promotionId ||
      deposit?.promotionTitle ||
      Number(deposit?.discountAmount || 0) > 0
    );
  };

  const finalPrice = () => {
    if (Number(deposit?.finalEstimatedPrice || 0) > 0) {
      return Number(deposit.finalEstimatedPrice);
    }
    return Math.max(Number(deposit?.totalEstimatedPrice || 0) - Number(deposit?.discountAmount || 0), 0);
  };

  const formatDateTime = (value) => {
    if (!value) return t('not_available');
    try {
      return new Date(value).toLocaleString("vi-VN");
    } catch {
      return t('not_available');
    }
  };

  const getStatusLabel = (status) => {
    const map = {
      pending_payment: 'deposit_status_pending_payment',
      paid: 'deposit_status_paid',
      confirmed: 'deposit_status_confirmed',
      waiting_full_payment: 'deposit_status_waiting_full_payment',
      ready_to_deliver: 'deposit_status_ready_to_deliver',
      completed: 'deposit_status_completed',
      cancelled: 'deposit_status_cancelled',
      refunded: 'deposit_status_refunded',
    };
    return status ? t(map[status] || status) : t('not_identified');
  };

  const getPaymentStatusLabel = (status) => {
    const map = {
      unpaid: 'payment_status_unpaid',
      paid: 'payment_status_paid',
      cancelled: 'payment_status_cancelled',
      failed: 'payment_status_failed',
    };
    return status ? t(map[status] || status) : t('not_identified');
  };

  const getDeliveryMethodLabel = (method) => {
    const map = {
      showroom: 'delivery_method_showroom',
      home_delivery: 'delivery_method_home',
    };
    return method ? t(map[method] || method) : t('not_available');
  };

  const getRefundStatusLabel = (status) => {
    const map = {
      none: 'refund_status_none',
      pending_refund: 'refund_status_pending',
      refunded: 'refund_status_refunded',
      forfeited: 'refund_status_forfeited',
    };
    return status ? t(map[status] || status) : t('not_identified');
  };

  const getCarStatusLabel = (status) => {
    const map = {
      available: 'car_status_available',
      reserved: 'car_status_reserved',
      sold: 'car_status_sold',
      hidden: 'car_status_hidden',
    };
    return status ? t(map[status] || status) : t('not_available');
  };

  const getBadgeClass = (status) => {
    if (["cancelled"].includes(status)) return "user-status-badge danger";
    if (["confirmed", "completed"].includes(status)) return "user-status-badge success";
    if (["pending_payment", "waiting_full_payment"].includes(status)) return "user-status-badge warning";
    if (["paid", "ready_to_deliver", "refunded"].includes(status)) return "user-status-badge info";
    return "user-status-badge";
  };

  const getInvoiceImageSrc = () => {
    if (!deposit?.invoiceImage) return "";
    if (deposit.invoiceImage.startsWith("http")) return deposit.invoiceImage;
    return `https://webbanxe-backend-stx9.onrender.com/${deposit.invoiceImage.replace(/^\/+/, "")}`;
  };

  if (loading) {
    return (
      <div className="user-deposit-detail-page">
        <MainNavbar />
        <div className="user-deposit-detail-container">
          <div className="user-loading-box">{t('loading_deposit_detail')}</div>
        </div>
      </div>
    );
  }

  if (!deposit) {
    return (
      <div className="user-deposit-detail-page">
        <MainNavbar />
        <div className="user-deposit-detail-container">
          <div className="user-error-box">
            <p>{message || t('msg_deposit_not_found')}</p>
            <button className="user-back-btn" onClick={() => navigate("/my-deposits")}>
              <ArrowLeft size={18} /><span>{t('back')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const car = deposit.carId || {};
  const customer = deposit.userId || {};
  const invoiceUploadedBy = deposit.invoiceUploadedBy || {};

  const carImage = car.image || car.images?.[0] || "https://images.unsplash.com/photo-1503376780353-7e6692767b70";
  const carName = car.name || deposit.carName || t('unknown_car');
  const invoiceImage = getInvoiceImageSrc();

  const fullName = deposit.fullName || customer.fullName || customer.name || user?.fullName || t('none');
  const phone = deposit.phone || customer.phone || t('none');
  const email = deposit.email || customer.email || t('none');
  const assignedStaff = deposit.assignedStaffName || invoiceUploadedBy.fullName || t('staff_not_assigned');

  return (
    <div className="user-deposit-detail-page">
      <MainNavbar />
      <div className="user-deposit-detail-container">

        {/* Nút back + nút xuất PDF — nằm ngoài vùng chụp */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
          <button className="user-back-btn" onClick={() => navigate("/my-deposits")}>
            <ArrowLeft size={18} /><span>{t('back')}</span>
          </button>
          <button
            onClick={xuatPDF}
            disabled={xuatDang}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px',
              background: xuatDang ? '#93c5fd' : '#1d4ed8',
              color: 'white', border: 'none', borderRadius: 8,
              cursor: xuatDang ? 'not-allowed' : 'pointer',
              fontWeight: 600, fontSize: 14,
            }}
          >
            🧾 {xuatDang ? 'Đang xuất...' : 'Xuất hóa đơn PDF'}
          </button>
        </div>

        {/* ===== VÙNG ĐƯỢC CHỤP THÀNH PDF ===== */}
        <div ref={hoaDonRef}>
          <div className="user-detail-header">
            <div>
              <h1>{t('deposit_detail_title')}</h1>
              <p>{t('deposit_detail_desc')}</p>
            </div>
            <div className={getBadgeClass(deposit.status)}>{getStatusLabel(deposit.status)}</div>
          </div>

          <div className="user-detail-grid top">
            <section className="user-detail-card">
              <h2>{t('section_order_info')}</h2>
              <div className="user-info-list">
                <div className="user-info-row"><span>{t('label_order_id')}</span><strong>{deposit._id}</strong></div>
                <div className="user-info-row"><span>{t('label_payment_code')}</span><strong>{deposit.orderCode || t('none')}</strong></div>
                <div className="user-info-row"><span>{t('label_order_status')}</span><strong>{getStatusLabel(deposit.status)}</strong></div>
                <div className="user-info-row"><span>{t('label_payment')}</span><strong>{getPaymentStatusLabel(deposit.paymentStatus)}</strong></div>
                <div className="user-info-row">
                  <span>{t('label_deposit_method')}</span>
                  <strong>{deposit.paymentMethod === "payos" ? "PayOS" : deposit.paymentMethod === "manual" ? t('payment_method_manual') : t('none')}</strong>
                </div>
                {hasVoucher() && (
                  <>
                    <div className="user-info-row"><span>{t('label_voucher')}</span><strong>{deposit.promotionTitle || t('promo_applied')}</strong></div>
                    <div className="user-info-row"><span>{t('label_discount_value')}</span><strong style={{ color: "#dc2626" }}>-{formatCurrency(deposit.discountAmount)}</strong></div>
                  </>
                )}
                <div className="user-info-row"><span>{t('label_created_at')}</span><strong>{formatDateTime(deposit.createdAt)}</strong></div>
                <div className="user-info-row"><span>{t('label_paid_at')}</span><strong>{formatDateTime(deposit.paidAt)}</strong></div>
                <div className="user-info-row"><span>{t('label_pickup_date')}</span><strong>{deposit.pickupDate || t('not_chosen')}</strong></div>
                <div className="user-info-row"><span>{t('label_time_slot')}</span><strong>{deposit.pickupTimeSlot || t('not_chosen')}</strong></div>
                <div className="user-info-row"><span>{t('label_delivery_method')}</span><strong>{getDeliveryMethodLabel(deposit.deliveryMethod)}</strong></div>
                <div className="user-info-row"><span>{t('label_showroom')}</span><strong>{deposit.showroom || t('none')}</strong></div>
                <div className="user-info-row"><span>{t('label_delivery_address')}</span><strong>{deposit.deliveryAddress || t('none')}</strong></div>
                <div className="user-info-row"><span>{t('label_refund_bank')}</span><strong>{deposit.refundBankBin || t('none')}</strong></div>
                <div className="user-info-row"><span>{t('label_refund_account')}</span><strong>{deposit.refundBankAccountNumber || t('none')}</strong></div>
                <div className="user-info-row"><span>{t('label_refund_account_name')}</span><strong>{deposit.refundBankAccountName || t('none')}</strong></div>
                <div className="user-info-row"><span>{t('label_note')}</span><strong>{deposit.note || t('none')}</strong></div>
              </div>
            </section>

            <section className="user-detail-card">
              <img src={carImage} alt={carName} className="user-car-image" />
              <div className="user-car-content">
                <p className="user-mini-label">{t('label_car_deposited')}</p>
                <h2>{carName}</h2>
                <div className="user-car-meta">
                  <p><strong>{t('label_car_brand')}:</strong> {car.brand || t('none')}</p>
                  <p><strong>{t('label_car_price_listed')}:</strong> {formatCurrency(car.price || deposit.carPrice)}</p>
                  <p><strong>{t('label_car_status')}:</strong> {getCarStatusLabel(car.status)}</p>
                  <p><strong>{t('label_deposit_percent')}:</strong> {deposit.depositPercent || 5}%</p>
                  <p><strong>{t('label_deposit_amount')}:</strong> {formatCurrency(deposit.depositAmount)}</p>
                  {hasVoucher() && (
                    <p><strong>{t('label_voucher')}:</strong> <span style={{ color: "#0f766e", fontWeight: 700 }}>{deposit.promotionTitle || t('promo_applied')}</span></p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="user-detail-grid bottom">
            <section className="user-detail-card">
              <h2>{t('section_finance_summary')}</h2>
              <div className="user-finance-grid">
                <div className="user-finance-item">
                  <div className="user-finance-icon"><Car size={18} /></div>
                  <div><span>{hasVoucher() ? t('label_original_price') : t('label_car_price')}</span><strong style={hasVoucher() ? { textDecoration: "line-through", opacity: 0.6 } : {}}>{formatCurrency(deposit.carPrice)}</strong></div>
                </div>
                {hasVoucher() && (
                  <>
                    <div className="user-finance-item"><div className="user-finance-icon"><Tag size={18} /></div><div><span>{t('label_voucher')}</span><strong style={{ color: "#0f766e" }}>{deposit.promotionTitle}</strong></div></div>
                    <div className="user-finance-item"><div className="user-finance-icon"><CircleDollarSign size={18} /></div><div><span>{t('label_discount_amount')}</span><strong style={{ color: "#dc2626" }}>-{formatCurrency(deposit.discountAmount)}</strong></div></div>
                    <div className="user-finance-item"><div className="user-finance-icon"><Receipt size={18} /></div><div><span>{t('label_price_after_discount')}</span><strong style={{ color: "#ca8a04" }}>{formatCurrency(finalPrice())}</strong></div></div>
                  </>
                )}
                <div className="user-finance-item"><div className="user-finance-icon"><CircleDollarSign size={18} /></div><div><span>{t('label_deposited')}</span><strong>{formatCurrency(deposit.depositAmount)}</strong></div></div>
                <div className="user-finance-item"><div className="user-finance-icon"><CreditCard size={18} /></div><div><span>{t('label_remaining_payment')}</span><strong>{formatCurrency(deposit.remainingAmount)}</strong></div></div>
                <div className="user-finance-item"><div className="user-finance-icon"><Receipt size={18} /></div><div><span>{t('label_refund')}</span><strong>{getRefundStatusLabel(deposit.refundStatus)}</strong></div></div>
              </div>
            </section>

            <section className="user-detail-card">
              <h2>{t('section_customer_info')}</h2>
              <div className="user-customer-box">
                <div className="user-customer-row"><User size={18} /><span>{fullName}</span></div>
                <div className="user-customer-row"><Phone size={18} /><span>{phone}</span></div>
                <div className="user-customer-row"><FileText size={18} /><span>{email}</span></div>
                <div className="user-customer-row"><ShieldCheck size={18} /><span>{t('label_assigned_staff')}: {assignedStaff}</span></div>
              </div>
            </section>
          </div>

          <section className="user-detail-card">
            <h2>{t('section_bill_detail')}</h2>
            <div className="user-bill-grid">
              <div className="user-bill-row"><span>{t('label_car_price')}</span><strong>{formatCurrency(deposit.carPrice)}</strong></div>
              <div className="user-bill-row"><span>{t('label_vat')}</span><strong>{formatCurrency(deposit.vatAmount)}</strong></div>
              <div className="user-bill-row"><span>{t('label_registration_fee')}</span><strong>{formatCurrency(deposit.registrationFee)}</strong></div>
              <div className="user-bill-row"><span>{t('label_license_fee')}</span><strong>{formatCurrency(deposit.licensePlateFee)}</strong></div>
              <div className="user-bill-row"><span>{t('label_insurance_fee')}</span><strong>{formatCurrency(deposit.insuranceFee)}</strong></div>
              <div className="user-bill-row highlight">
                <span>{hasVoucher() ? t('label_total_original_cost') : t('label_total_estimated_cost')}</span>
                <strong style={hasVoucher() ? { textDecoration: "line-through", opacity: 0.6 } : {}}>{formatCurrency(deposit.totalEstimatedPrice)}</strong>
              </div>
              {hasVoucher() && (
                <>
                  <div className="user-bill-row"><span>{t('label_voucher')}</span><strong style={{ color: "#0f766e" }}>{deposit.promotionTitle}</strong></div>
                  <div className="user-bill-row"><span>{t('label_discount_amount')}</span><strong style={{ color: "#dc2626" }}>-{formatCurrency(deposit.discountAmount)}</strong></div>
                  <div className="user-bill-row highlight"><span>{t('label_price_after_discount')}</span><strong style={{ color: "#ca8a04" }}>{formatCurrency(finalPrice())}</strong></div>
                </>
              )}
              <div className="user-bill-row"><span>{t('label_deposit_amount')}</span><strong>{formatCurrency(deposit.depositAmount)}</strong></div>
              <div className="user-bill-row remain"><span>{t('label_remaining_payment')}</span><strong>{formatCurrency(deposit.remainingAmount)}</strong></div>
            </div>
          </section>

          <div className="user-payment-section">
            <section className="user-detail-card user-proof-panel">
              <h2>{t('section_invoice')}</h2>
              {invoiceImage ? (
                <div className="user-proof-box">
                  <div className="user-invoice-image-wrap">
                    <img src={invoiceImage} alt="Invoice" className="user-invoice-image" onClick={() => setPreview(invoiceImage)} style={{ cursor: "zoom-in" }} />
                  </div>
                  <div className="user-invoice-meta">
                    <div><strong>{t('label_note')}:</strong> {deposit.invoiceNote || t('none')}</div>
                    <div><strong>{t('label_uploaded_by')}:</strong> {invoiceUploadedBy.fullName || invoiceUploadedBy.name || t('none')}</div>
                    <div><strong>{t('label_uploaded_at')}:</strong> {formatDateTime(deposit.invoiceUploadedAt)}</div>
                  </div>
                </div>
              ) : (
                <div className="user-invoice-empty">
                  <ImageIcon size={18} /><span>{t('msg_no_invoice')}</span>
                </div>
              )}
            </section>

            <section className="user-detail-card user-refund-panel">
              <h2>{t('section_refund_info')}</h2>
              <div className="user-refund-list">
                <div className="user-refund-row"><span>{t('label_refund_status')}</span><strong>{getRefundStatusLabel(deposit.refundStatus)}</strong></div>
                <div className="user-refund-row"><span>{t('label_refund_reason')}</span><strong>{deposit.refundReason || t('none')}</strong></div>
                <div className="user-refund-row"><span>{t('label_refund_amount')}</span><strong>{formatCurrency(deposit.refundAmount)}</strong></div>
                <div className="user-refund-row"><span>{t('label_refund_at')}</span><strong>{formatDateTime(deposit.refundAt)}</strong></div>
                <div className="user-refund-row"><span>{t('label_refund_ref_id')}</span><strong>{deposit.refundReferenceId || t('none')}</strong></div>
              </div>
            </section>
          </div>
        </div>
        {/* ===== KẾT THÚC VÙNG CHỤP PDF ===== */}

        {message && <div className="user-error-box">{message}</div>}
        {preview && (
          <div className="image-preview" onClick={() => setPreview(null)}>
            <img src={preview} alt="preview" />
          </div>
        )}
      </div>
    </div>
  );
}