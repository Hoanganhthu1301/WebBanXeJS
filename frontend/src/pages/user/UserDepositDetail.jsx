import { useEffect, useMemo, useState } from "react";
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

const API_URL = "http://localhost:5000/api";

export default function UserDepositDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [deposit, setDeposit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDepositDetail = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/deposits/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDeposit(res.data?.deposit || null);
    } catch (error) {
      console.error("fetchDepositDetail error:", error);
      setMessage(
        error?.response?.data?.message || "Không lấy được chi tiết đơn đặt cọc"
      );
    } finally {
      setLoading(false);
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

    return Math.max(
      Number(deposit?.totalEstimatedPrice || 0) -
        Number(deposit?.discountAmount || 0),
      0
    );
  };

  const formatDateTime = (value) => {
    if (!value) return "Chưa có";
    try {
      return new Date(value).toLocaleString("vi-VN");
    } catch {
      return "Chưa có";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending_payment":
        return "Chờ thanh toán cọc";
      case "paid":
        return "Đã thanh toán cọc";
      case "confirmed":
        return "Đã xác nhận cọc";
      case "waiting_full_payment":
        return "Chờ thanh toán phần còn lại";
      case "ready_to_deliver":
        return "Sẵn sàng giao xe";
      case "completed":
        return "Hoàn tất";
      case "cancelled":
        return "Đã hủy";
      case "refunded":
        return "Đã hoàn cọc";
      default:
        return status || "Không xác định";
    }
  };

  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case "unpaid":
        return "Chưa thanh toán";
      case "paid":
        return "Đã thanh toán";
      case "cancelled":
        return "Đã hủy thanh toán";
      case "failed":
        return "Thanh toán thất bại";
      default:
        return status || "Không xác định";
    }
  };

  const getDeliveryMethodLabel = (method) => {
    switch (method) {
      case "showroom":
        return "Nhận tại showroom";
      case "home_delivery":
        return "Giao tận nơi";
      default:
        return "Chưa có";
    }
  };

  const getRefundStatusLabel = (status) => {
    switch (status) {
      case "none":
        return "Không có";
      case "pending_refund":
        return "Chờ hoàn cọc";
      case "refunded":
        return "Đã hoàn cọc";
      case "forfeited":
        return "Mất cọc";
      default:
        return status || "Không xác định";
    }
  };

  const getCarStatusLabel = (status) => {
    switch (status) {
      case "available":
        return "Đang bán";
      case "reserved":
        return "Đã giữ xe";
      case "sold":
        return "Đã bán";
      case "hidden":
        return "Đang ẩn";
      default:
        return status || "Chưa có";
    }
  };

  const getBadgeClass = (status) => {
    if (["cancelled"].includes(status)) return "user-status-badge danger";
    if (["confirmed", "completed"].includes(status))
      return "user-status-badge success";
    if (["pending_payment", "waiting_full_payment"].includes(status)) {
      return "user-status-badge warning";
    }
    if (["paid", "ready_to_deliver", "refunded"].includes(status)) {
      return "user-status-badge info";
    }
    return "user-status-badge";
  };

  const getInvoiceImageSrc = () => {
    if (!deposit?.invoiceImage) return "";

    if (deposit.invoiceImage.startsWith("http")) {
      return deposit.invoiceImage;
    }

    return `http://localhost:5000/${deposit.invoiceImage.replace(/^\/+/, "")}`;
  };

  if (loading) {
    return (
      <div className="user-deposit-detail-page">
        <MainNavbar />
        <div className="user-deposit-detail-container">
          <div className="user-loading-box">Đang tải chi tiết đơn đặt cọc...</div>
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
            <p>{message || "Không tìm thấy đơn đặt cọc"}</p>
            <button
              className="user-back-btn"
              onClick={() => navigate("/my-deposits")}
            >
              <ArrowLeft size={18} />
              <span>Quay lại</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const car = deposit.carId || {};
  const customer = deposit.userId || {};
  const invoiceUploadedBy = deposit.invoiceUploadedBy || {};

  const carImage =
    car.image ||
    car.images?.[0] ||
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop";

  const carName = car.name || deposit.carName || "Chưa có tên xe";
  const brandName = car.brand || "Chưa có";
  const invoiceImage = getInvoiceImageSrc();

  const fullName =
    deposit.fullName ||
    customer.fullName ||
    customer.name ||
    user?.fullName ||
    "Chưa có";

  const phone = deposit.phone || customer.phone || "Chưa có";
  const email = deposit.email || customer.email || "Chưa có";

  const assignedStaff =
    deposit.assignedStaffName ||
    invoiceUploadedBy.fullName ||
    invoiceUploadedBy.name ||
    "Chưa phân công";

  return (
    <div className="user-deposit-detail-page">
      <MainNavbar />

      <div className="user-deposit-detail-container">
        <button
          className="user-back-btn"
          onClick={() => navigate("/my-deposits")}
        >
          <ArrowLeft size={18} />
          <span>Quay lại</span>
        </button>

        <div className="user-detail-header">
          <div>
            <h1>Chi tiết đơn đặt cọc</h1>
            <p>
              Xem thông tin đơn hàng, khách hàng, xe, thanh toán, hóa đơn và
              trạng thái xử lý theo giao diện gọn gàng, dễ theo dõi.
            </p>
          </div>

          <div className={getBadgeClass(deposit.status)}>
            {getStatusLabel(deposit.status)}
          </div>
        </div>

        <div className="user-detail-grid top">
          <section className="user-detail-card">
            <h2>Thông tin đơn</h2>

            <div className="user-info-list">
              <div className="user-info-row">
                <span>Mã đơn</span>
                <strong>{deposit._id}</strong>
              </div>

              <div className="user-info-row">
                <span>Mã thanh toán</span>
                <strong>{deposit.orderCode || "Chưa có"}</strong>
              </div>

              <div className="user-info-row">
                <span>Trạng thái đơn</span>
                <strong>{getStatusLabel(deposit.status)}</strong>
              </div>

              <div className="user-info-row">
                <span>Thanh toán</span>
                <strong>{getPaymentStatusLabel(deposit.paymentStatus)}</strong>
              </div>

              <div className="user-info-row">
                <span>Phương thức cọc</span>
                <strong>
                  {deposit.paymentMethod === "payos"
                    ? "PayOS"
                    : deposit.paymentMethod === "manual"
                    ? "Thủ công"
                    : "Chưa có"}
                </strong>
              </div>

              {hasVoucher() && (
                <>
                  <div className="user-info-row">
                    <span>Voucher áp dụng</span>
                    <strong>{deposit.promotionTitle || "Ưu đãi áp dụng"}</strong>
                  </div>

                  <div className="user-info-row">
                    <span>Giá trị giảm</span>
                    <strong style={{ color: "#dc2626" }}>
                      -{formatCurrency(deposit.discountAmount)}
                    </strong>
                  </div>
                </>
              )}

              <div className="user-info-row">
                <span>Ngày tạo</span>
                <strong>{formatDateTime(deposit.createdAt)}</strong>
              </div>

              <div className="user-info-row">
                <span>Đã thanh toán cọc lúc</span>
                <strong>{formatDateTime(deposit.paidAt)}</strong>
              </div>

              <div className="user-info-row">
                <span>Ngày nhận xe</span>
                <strong>{deposit.pickupDate || "Chưa chọn"}</strong>
              </div>

              <div className="user-info-row">
                <span>Khung giờ</span>
                <strong>{deposit.pickupTimeSlot || "Chưa chọn"}</strong>
              </div>

              <div className="user-info-row">
                <span>Hình thức nhận</span>
                <strong>{getDeliveryMethodLabel(deposit.deliveryMethod)}</strong>
              </div>

              <div className="user-info-row">
                <span>Showroom</span>
                <strong>{deposit.showroom || "Không có"}</strong>
              </div>

              <div className="user-info-row">
                <span>Địa chỉ giao</span>
                <strong>{deposit.deliveryAddress || "Không có"}</strong>
              </div>

              <div className="user-info-row">
                <span>Ngân hàng hoàn tiền</span>
                <strong>{deposit.refundBankBin || "Chưa có"}</strong>
              </div>

              <div className="user-info-row">
                <span>Số tài khoản hoàn</span>
                <strong>{deposit.refundBankAccountNumber || "Chưa có"}</strong>
              </div>

              <div className="user-info-row">
                <span>Tên chủ tài khoản</span>
                <strong>{deposit.refundBankAccountName || "Chưa có"}</strong>
              </div>

              <div className="user-info-row">
                <span>Ghi chú</span>
                <strong>{deposit.note || "Không có"}</strong>
              </div>
            </div>
          </section>

          <section className="user-detail-card">
            <img src={carImage} alt={carName} className="user-car-image" />

            <div className="user-car-content">
              <p className="user-mini-label">Xe đã đặt cọc</p>
              <h2>{carName}</h2>

              <div className="user-car-meta">
                <p>
                  <strong>Hãng xe:</strong> {brandName}
                </p>
                <p>
                  <strong>Giá xe niêm yết:</strong>{" "}
                  {formatCurrency(car.price || deposit.carPrice)}
                </p>
                <p>
                  <strong>Trạng thái xe:</strong> {getCarStatusLabel(car.status)}
                </p>
                <p>
                  <strong>Tỷ lệ cọc:</strong> {deposit.depositPercent || 5}%
                </p>
                <p>
                  <strong>Số tiền cọc:</strong>{" "}
                  {formatCurrency(deposit.depositAmount)}
                </p>
                {hasVoucher() && (
                  <p>
                    <strong>Voucher:</strong>{" "}
                    <span style={{ color: "#0f766e", fontWeight: 700 }}>
                      {deposit.promotionTitle || "Ưu đãi áp dụng"}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="user-detail-grid bottom">
          <section className="user-detail-card">
            <h2>Tóm tắt tài chính</h2>

            <div className="user-finance-grid">
              <div className="user-finance-item">
                <div className="user-finance-icon">
                  <Car size={18} />
                </div>
                <div>
                  <span>{hasVoucher() ? "Giá gốc" : "Giá xe"}</span>
                  <strong
                    style={
                      hasVoucher()
                        ? { textDecoration: "line-through", opacity: 0.6 }
                        : {}
                    }
                  >
                    {formatCurrency(deposit.carPrice)}
                  </strong>
                </div>
              </div>

              {hasVoucher() && (
                <div className="user-finance-item">
                  <div className="user-finance-icon">
                    <Tag size={18} />
                  </div>
                  <div>
                    <span>Voucher</span>
                    <strong style={{ color: "#0f766e" }}>
                      {deposit.promotionTitle || "Ưu đãi áp dụng"}
                    </strong>
                  </div>
                </div>
              )}

              {hasVoucher() && (
                <div className="user-finance-item">
                  <div className="user-finance-icon">
                    <CircleDollarSign size={18} />
                  </div>
                  <div>
                    <span>Giảm giá</span>
                    <strong style={{ color: "#dc2626" }}>
                      -{formatCurrency(deposit.discountAmount)}
                    </strong>
                  </div>
                </div>
              )}

              {hasVoucher() && (
                <div className="user-finance-item">
                  <div className="user-finance-icon">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <span>Giá sau ưu đãi</span>
                    <strong style={{ color: "#ca8a04" }}>
                      {formatCurrency(finalPrice())}
                    </strong>
                  </div>
                </div>
              )}

              <div className="user-finance-item">
                <div className="user-finance-icon">
                  <CircleDollarSign size={18} />
                </div>
                <div>
                  <span>Đã cọc</span>
                  <strong>{formatCurrency(deposit.depositAmount)}</strong>
                </div>
              </div>

              <div className="user-finance-item">
                <div className="user-finance-icon">
                  <CreditCard size={18} />
                </div>
                <div>
                  <span>Còn phải thanh toán</span>
                  <strong>{formatCurrency(deposit.remainingAmount)}</strong>
                </div>
              </div>

              <div className="user-finance-item">
                <div className="user-finance-icon">
                  <Receipt size={18} />
                </div>
                <div>
                  <span>Hoàn cọc</span>
                  <strong>{getRefundStatusLabel(deposit.refundStatus)}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="user-detail-card">
            <h2>Thông tin khách hàng</h2>

            <div className="user-customer-box">
              <div className="user-customer-row">
                <User size={18} />
                <span>{fullName}</span>
              </div>

              <div className="user-customer-row">
                <Phone size={18} />
                <span>{phone}</span>
              </div>

              <div className="user-customer-row">
                <FileText size={18} />
                <span>{email}</span>
              </div>

              <div className="user-customer-row">
                <ShieldCheck size={18} />
                <span>Nhân viên phụ trách: {assignedStaff}</span>
              </div>
            </div>
          </section>
        </div>

        <section className="user-detail-card">
          <h2>Chi tiết hóa đơn</h2>

          <div className="user-bill-grid">
            <div className="user-bill-row">
              <span>Giá xe</span>
              <strong>{formatCurrency(deposit.carPrice)}</strong>
            </div>

            <div className="user-bill-row">
              <span>VAT</span>
              <strong>{formatCurrency(deposit.vatAmount)}</strong>
            </div>

            <div className="user-bill-row">
              <span>Phí trước bạ</span>
              <strong>{formatCurrency(deposit.registrationFee)}</strong>
            </div>

            <div className="user-bill-row">
              <span>Phí biển số</span>
              <strong>{formatCurrency(deposit.licensePlateFee)}</strong>
            </div>

            <div className="user-bill-row">
              <span>Bảo hiểm</span>
              <strong>{formatCurrency(deposit.insuranceFee)}</strong>
            </div>

            <div className="user-bill-row highlight">
              <span>{hasVoucher() ? "Tổng chi phí gốc" : "Tổng chi phí dự kiến"}</span>
              <strong
                style={
                  hasVoucher()
                    ? { textDecoration: "line-through", opacity: 0.6 }
                    : {}
                }
              >
                {formatCurrency(deposit.totalEstimatedPrice)}
              </strong>
            </div>

            {hasVoucher() && (
              <>
                <div className="user-bill-row">
                  <span>Voucher</span>
                  <strong style={{ color: "#0f766e" }}>
                    {deposit.promotionTitle || "Ưu đãi"}
                  </strong>
                </div>

                <div className="user-bill-row">
                  <span>Giảm giá</span>
                  <strong style={{ color: "#dc2626" }}>
                    -{formatCurrency(deposit.discountAmount)}
                  </strong>
                </div>

                <div className="user-bill-row highlight">
                  <span>Tổng sau ưu đãi</span>
                  <strong style={{ color: "#ca8a04" }}>
                    {formatCurrency(finalPrice())}
                  </strong>
                </div>
              </>
            )}

            <div className="user-bill-row">
              <span>Tiền cọc</span>
              <strong>{formatCurrency(deposit.depositAmount)}</strong>
            </div>

            <div className="user-bill-row remain">
              <span>Còn phải thanh toán</span>
              <strong>{formatCurrency(deposit.remainingAmount)}</strong>
            </div>
          </div>
        </section>

        <div className="user-payment-section">
          <section className="user-detail-card user-proof-panel">
            <h2>Hóa đơn / minh chứng thanh toán</h2>

            {invoiceImage ? (
              <div className="user-proof-box">
                <div className="user-invoice-image-wrap">
                  <img
                    src={invoiceImage}
                    alt="Hóa đơn thanh toán"
                    className="user-invoice-image"
                    onClick={() => setPreview(invoiceImage)}
                    style={{ cursor: "zoom-in" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                <div className="user-invoice-meta">
                  <div>
                    <strong>Ghi chú:</strong> {deposit.invoiceNote || "Không có"}
                  </div>
                  <div>
                    <strong>Người upload:</strong>{" "}
                    {invoiceUploadedBy.fullName ||
                      invoiceUploadedBy.name ||
                      "Chưa có"}
                  </div>
                  <div>
                    <strong>Thời gian upload:</strong>{" "}
                    {formatDateTime(deposit.invoiceUploadedAt)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="user-invoice-empty">
                <ImageIcon size={18} />
                <span>Chưa có hóa đơn hoặc minh chứng được cập nhật</span>
              </div>
            )}
          </section>

          <section className="user-detail-card user-refund-panel">
            <h2>Thông tin hoàn cọc</h2>

            <div className="user-refund-list">
              <div className="user-refund-row">
                <span>Trạng thái hoàn cọc</span>
                <strong>{getRefundStatusLabel(deposit.refundStatus)}</strong>
              </div>

              <div className="user-refund-row">
                <span>Lý do</span>
                <strong>{deposit.refundReason || "Không có"}</strong>
              </div>

              <div className="user-refund-row">
                <span>Số tiền hoàn</span>
                <strong>{formatCurrency(deposit.refundAmount)}</strong>
              </div>

              <div className="user-refund-row">
                <span>Thời gian hoàn</span>
                <strong>{formatDateTime(deposit.refundAt)}</strong>
              </div>

              <div className="user-refund-row">
                <span>Mã giao dịch hoàn</span>
                <strong>{deposit.refundReferenceId || "Chưa có"}</strong>
              </div>
            </div>
          </section>
        </div>

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