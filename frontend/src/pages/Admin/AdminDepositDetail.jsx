import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/admin/AdminDepositDetail.css";

export default function AdminDepositDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deposit, setDeposit] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [invoiceNote, setInvoiceNote] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`https://webbanxe-backend-stx9.onrender.com/api/deposits/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDeposit(res.data.deposit);
      setMessage("");
    } catch (error) {
      console.error("fetchDetail error:", error);
      setMessage(
        error?.response?.data?.message || "Lỗi server khi lấy chi tiết đơn"
      );
    } finally {
      setLoading(false);
    }
  };

  const uploadInvoice = async () => {
    try {
      if (!file) {
        alert("Vui lòng chọn ảnh hóa đơn");
        return;
      }

      const formData = new FormData();
      formData.append("invoice", file);
      formData.append("invoiceNote", invoiceNote);

      await axios.put(
        `https://webbanxe-backend-stx9.onrender.com/api/deposits/${id}/upload-invoice`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setFile(null);
      setInvoiceNote("");
      await fetchDetail();
      alert("Tải hóa đơn thành công");
    } catch (error) {
      console.error("uploadInvoice error:", error);
      alert(error?.response?.data?.message || "Upload hóa đơn thất bại");
    }
  };

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("vi-VN") + "đ";
  };

  const formatDateTime = (value) => {
    if (!value) return "Chưa có";
    try {
      return new Date(value).toLocaleString("vi-VN");
    } catch {
      return "Chưa có";
    }
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

  const getInvoiceImageSrc = () => {
    if (!deposit?.invoiceImage) return "";

    if (deposit.invoiceImage.startsWith("http")) {
      return deposit.invoiceImage;
    }

    return `https://webbanxe-backend-stx9.onrender.com${deposit.invoiceImage}`;
  };

  if (loading) {
    return (
      <div className="deposit-detail-lux-page">
        <div className="deposit-detail-lux-container">
          <div className="deposit-detail-state-box">Đang tải chi tiết đơn...</div>
        </div>
      </div>
    );
  }

  if (!deposit) {
    return (
      <div className="deposit-detail-lux-page">
        <div className="deposit-detail-lux-container">
          <button className="deposit-detail-back" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
          <div className="deposit-detail-state-box error">
            {message || "Không tìm thấy chi tiết đơn"}
          </div>
        </div>
      </div>
    );
  }

  const car = deposit.carId || {};
  const customer = deposit.userId || {};
  const invoiceUploadedBy = deposit.invoiceUploadedBy || {};

  return (
    <div className="deposit-detail-lux-page">
      <div className="deposit-detail-lux-container">
        <button className="deposit-detail-back" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>

        <div className="deposit-detail-hero">
          <div className="deposit-detail-hero-left">
            <h1>Chi tiết đơn đặt cọc</h1>
            <p>
              Theo dõi thông tin khách hàng, xe, hóa đơn, voucher và chứng từ
              của đơn đặt cọc theo phong cách trực quan, dễ đọc.
            </p>
          </div>

          <div className={`deposit-status-pill status-${deposit.status}`}>
            {getStatusLabel(deposit.status)}
          </div>
        </div>

        <div className="deposit-detail-main-grid">
          <div className="deposit-detail-main-left">
            <section className="lux-card">
              <h2>Thông tin đơn</h2>
              <div className="lux-info-list">
                <div className="lux-info-row">
                  <div className="lux-info-label">Mã đơn</div>
                  <div className="lux-info-value">{deposit._id}</div>
                </div>

                <div className="lux-info-row">
                  <div className="lux-info-label">Mã thanh toán</div>
                  <div className="lux-info-value">
                    {deposit.orderCode || "Chưa có"}
                  </div>
                </div>

                <div className="lux-info-row">
                  <div className="lux-info-label">Trạng thái đơn</div>
                  <div className="lux-info-value">
                    {getStatusLabel(deposit.status)}
                  </div>
                </div>

                <div className="lux-info-row">
                  <div className="lux-info-label">Thanh toán</div>
                  <div className="lux-info-value">
                    {getPaymentStatusLabel(deposit.paymentStatus)}
                  </div>
                </div>

                <div className="lux-info-row">
                  <div className="lux-info-label">Phương thức cọc</div>
                  <div className="lux-info-value">
                    {deposit.paymentMethod === "payos"
                      ? "PayOS"
                      : deposit.paymentMethod === "manual"
                      ? "Thủ công"
                      : "Chưa có"}
                  </div>
                </div>

                {hasVoucher() && (
                  <>
                    <div className="lux-info-row">
                      <div className="lux-info-label">Voucher áp dụng</div>
                      <div
                        className="lux-info-value"
                        style={{ color: "#0f766e", fontWeight: 700 }}
                      >
                        {deposit.promotionTitle || "Ưu đãi áp dụng"}
                      </div>
                    </div>

                    <div className="lux-info-row">
                      <div className="lux-info-label">Giảm giá</div>
                      <div
                        className="lux-info-value"
                        style={{ color: "#dc2626", fontWeight: 700 }}
                      >
                        -{formatMoney(deposit.discountAmount)}
                      </div>
                    </div>

                    <div className="lux-info-row">
                      <div className="lux-info-label">Tổng sau ưu đãi</div>
                      <div
                        className="lux-info-value"
                        style={{ color: "#ca8a04", fontWeight: 800 }}
                      >
                        {formatMoney(finalPrice())}
                      </div>
                    </div>
                  </>
                )}

                <div className="lux-info-row">
                  <div className="lux-info-label">Ngày tạo</div>
                  <div className="lux-info-value">
                    {formatDateTime(deposit.createdAt)}
                  </div>
                </div>

                <div className="lux-info-row">
                  <div className="lux-info-label">Đã thanh toán cọc lúc</div>
                  <div className="lux-info-value">
                    {formatDateTime(deposit.paidAt)}
                  </div>
                </div>

                <div className="lux-info-row">
                  <div className="lux-info-label">Ghi chú</div>
                  <div className="lux-info-value">
                    {deposit.note || "Không có"}
                  </div>
                </div>
              </div>
            </section>

            <section className="lux-card">
              <h2>Thông tin khách hàng</h2>

              <div className="lux-form-grid one">
                <div className="lux-field">
                  <label>Họ và tên</label>
                  <div className="lux-input-look">
                    {deposit.fullName ||
                      customer.fullName ||
                      customer.name ||
                      "Chưa có"}
                  </div>
                </div>
              </div>

              <div className="lux-form-grid two">
                <div className="lux-field">
                  <label>Số điện thoại</label>
                  <div className="lux-input-look">
                    {deposit.phone || customer.phone || "Chưa có"}
                  </div>
                </div>

                <div className="lux-field">
                  <label>Email</label>
                  <div className="lux-input-look">
                    {deposit.email || customer.email || "Chưa có"}
                  </div>
                </div>
              </div>
            </section>

            <section className="lux-card">
              <h2>Lịch nhận xe</h2>
              <div className="lux-note-box">
                <div>
                  <strong>Ngày nhận xe:</strong> {deposit.pickupDate || "Chưa chọn"}
                </div>
                <div>
                  <strong>Khung giờ:</strong>{" "}
                  {deposit.pickupTimeSlot || "Chưa chọn"}
                </div>
                <div>
                  <strong>Hình thức nhận:</strong>{" "}
                  {getDeliveryMethodLabel(deposit.deliveryMethod)}
                </div>
                <div>
                  <strong>Showroom:</strong> {deposit.showroom || "Không có"}
                </div>
                <div>
                  <strong>Địa chỉ giao:</strong>{" "}
                  {deposit.deliveryAddress || "Không có"}
                </div>
              </div>
            </section>

            <section className="lux-card">
              <h2>Chi tiết hóa đơn</h2>
              <div className="lux-bill-card">
                <div className="lux-bill-row">
                  <span>Giá xe</span>
                  <strong>{formatMoney(deposit.carPrice)}</strong>
                </div>
                <div className="lux-bill-row">
                  <span>VAT</span>
                  <strong>{formatMoney(deposit.vatAmount)}</strong>
                </div>
                <div className="lux-bill-row">
                  <span>Phí trước bạ</span>
                  <strong>{formatMoney(deposit.registrationFee)}</strong>
                </div>
                <div className="lux-bill-row">
                  <span>Phí biển số</span>
                  <strong>{formatMoney(deposit.licensePlateFee)}</strong>
                </div>
                <div className="lux-bill-row">
                  <span>Bảo hiểm</span>
                  <strong>{formatMoney(deposit.insuranceFee)}</strong>
                </div>

                <div className="lux-bill-row total">
                  <span>{hasVoucher() ? "Tổng chi phí gốc" : "Tổng chi phí dự kiến"}</span>
                  <strong
                    style={
                      hasVoucher()
                        ? { textDecoration: "line-through", opacity: 0.65 }
                        : {}
                    }
                  >
                    {formatMoney(deposit.totalEstimatedPrice)}
                  </strong>
                </div>

                {hasVoucher() && (
                  <>
                    <div className="lux-bill-row">
                      <span>Voucher</span>
                      <strong style={{ color: "#0f766e" }}>
                        {deposit.promotionTitle || "Ưu đãi áp dụng"}
                      </strong>
                    </div>

                    <div className="lux-bill-row">
                      <span>Giảm giá</span>
                      <strong style={{ color: "#dc2626" }}>
                        -{formatMoney(deposit.discountAmount)}
                      </strong>
                    </div>

                    <div className="lux-bill-row total">
                      <span>Tổng sau ưu đãi</span>
                      <strong style={{ color: "#ca8a04" }}>
                        {formatMoney(finalPrice())}
                      </strong>
                    </div>
                  </>
                )}

                <div className="lux-bill-row deposit">
                  <span>Tiền cọc</span>
                  <strong>{formatMoney(deposit.depositAmount)}</strong>
                </div>
                <div className="lux-bill-row remain">
                  <span>Còn phải thanh toán</span>
                  <strong>{formatMoney(deposit.remainingAmount)}</strong>
                </div>
              </div>
            </section>

            <section className="lux-card">
              <h2>Hóa đơn / chứng từ</h2>

              <div className="lux-upload-box">
                <label className="lux-upload-title">Chọn ảnh hóa đơn</label>

                <input
                  className="lux-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                {file && (
                  <div className="lux-file-name">File đã chọn: {file.name}</div>
                )}

                <textarea
                  className="lux-textarea"
                  placeholder="Nhập ghi chú hóa đơn hoặc thông tin bổ sung..."
                  value={invoiceNote}
                  onChange={(e) => setInvoiceNote(e.target.value)}
                />

                <button className="lux-upload-btn" onClick={uploadInvoice}>
                  Tải ảnh hóa đơn
                </button>
              </div>

              {deposit.invoiceImage && (
                <div className="lux-upload-preview">
                  <button
                    type="button"
                    className="lux-image-button"
                    onClick={() => setPreviewOpen(true)}
                    title="Bấm để xem ảnh lớn"
                  >
                    <img
                      className="lux-upload-image"
                      src={getInvoiceImageSrc()}
                      alt="Hóa đơn"
                      onError={(e) => {
                        console.log("Image load error:", getInvoiceImageSrc());
                        e.currentTarget.src =
                          "https://via.placeholder.com/900x600?text=Khong+tai+duoc+anh";
                      }}
                    />
                  </button>

                  <div className="lux-note-box upload-meta">
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
                    <div className="lux-debug-url">{getInvoiceImageSrc()}</div>
                  </div>
                </div>
              )}
            </section>

            <section className="lux-card">
              <h2>Thông tin hoàn cọc</h2>
              <div className="lux-info-list">
                <div className="lux-info-row">
                  <div className="lux-info-label">Trạng thái hoàn cọc</div>
                  <div className="lux-info-value">
                    {getRefundStatusLabel(deposit.refundStatus)}
                  </div>
                </div>

                <div className="lux-info-row">
                  <div className="lux-info-label">Lý do</div>
                  <div className="lux-info-value">
                    {deposit.refundReason || "Không có"}
                  </div>
                </div>

                <div className="lux-info-row">
                  <div className="lux-info-label">Số tiền hoàn</div>
                  <div className="lux-info-value">
                    {formatMoney(deposit.refundAmount)}
                  </div>
                </div>

                <div className="lux-info-row">
                  <div className="lux-info-label">Thời gian hoàn</div>
                  <div className="lux-info-value">
                    {formatDateTime(deposit.refundAt)}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="deposit-detail-main-right">
            <aside className="lux-card sticky">
              {(car.image || car.images?.[0]) && (
                <img
                  className="lux-car-main-image"
                  src={car.image || car.images?.[0]}
                  alt={car.name || deposit.carName}
                />
              )}

              <div className="lux-side-subtitle">Chi tiết đơn đặt cọc</div>

              <h3 className="lux-car-title">
                {car.name || deposit.carName || "Chưa có tên xe"}
              </h3>

              <div className="lux-side-specs">
                <div>
                  <strong>Hãng xe:</strong> {car.brand || "Chưa có"}
                </div>
                <div>
                  <strong>Giá xe niêm yết:</strong>{" "}
                  <span
                    style={
                      hasVoucher()
                        ? { textDecoration: "line-through", opacity: 0.65 }
                        : {}
                    }
                  >
                    {formatMoney(car.price || deposit.carPrice)}
                  </span>
                </div>

                {hasVoucher() && (
                  <>
                    <div>
                      <strong>Voucher:</strong>{" "}
                      <span style={{ color: "#0f766e", fontWeight: 700 }}>
                        {deposit.promotionTitle || "Ưu đãi áp dụng"}
                      </span>
                    </div>
                    <div>
                      <strong>Giảm giá:</strong>{" "}
                      <span style={{ color: "#dc2626", fontWeight: 700 }}>
                        -{formatMoney(deposit.discountAmount)}
                      </span>
                    </div>
                    <div>
                      <strong>Giá sau ưu đãi:</strong>{" "}
                      <span style={{ color: "#ca8a04", fontWeight: 800 }}>
                        {formatMoney(finalPrice())}
                      </span>
                    </div>
                  </>
                )}

                <div>
                  <strong>Trạng thái xe:</strong> {getCarStatusLabel(car.status)}
                </div>
                <div>
                  <strong>Tỷ lệ cọc:</strong> {deposit.depositPercent || 5}%
                </div>
                <div>
                  <strong>Số tiền cọc tối thiểu:</strong>{" "}
                  {formatMoney(deposit.depositAmount)}
                </div>
              </div>

              <div className="lux-side-bill">
                <h4>Chi tiết thanh toán dự kiến</h4>

                <div className="lux-mini-bill-row">
                  <span>Giá xe</span>
                  <strong>{formatMoney(deposit.carPrice)}</strong>
                </div>
                <div className="lux-mini-bill-row">
                  <span>VAT</span>
                  <strong>{formatMoney(deposit.vatAmount)}</strong>
                </div>
                <div className="lux-mini-bill-row">
                  <span>Phí trước bạ</span>
                  <strong>{formatMoney(deposit.registrationFee)}</strong>
                </div>
                <div className="lux-mini-bill-row">
                  <span>Phí biển số</span>
                  <strong>{formatMoney(deposit.licensePlateFee)}</strong>
                </div>
                <div className="lux-mini-bill-row">
                  <span>Bảo hiểm</span>
                  <strong>{formatMoney(deposit.insuranceFee)}</strong>
                </div>

                <div className="lux-mini-bill-row total">
                  <span>{hasVoucher() ? "Tổng chi phí gốc" : "Tổng chi phí dự kiến"}</span>
                  <strong
                    style={
                      hasVoucher()
                        ? { textDecoration: "line-through", opacity: 0.65 }
                        : {}
                    }
                  >
                    {formatMoney(deposit.totalEstimatedPrice)}
                  </strong>
                </div>

                {hasVoucher() && (
                  <>
                    <div className="lux-mini-bill-row">
                      <span>Voucher</span>
                      <strong style={{ color: "#0f766e" }}>
                        {deposit.promotionTitle || "Ưu đãi áp dụng"}
                      </strong>
                    </div>
                    <div className="lux-mini-bill-row">
                      <span>Giảm giá</span>
                      <strong style={{ color: "#dc2626" }}>
                        -{formatMoney(deposit.discountAmount)}
                      </strong>
                    </div>
                    <div className="lux-mini-bill-row total">
                      <span>Tổng sau ưu đãi</span>
                      <strong style={{ color: "#ca8a04" }}>
                        {formatMoney(finalPrice())}
                      </strong>
                    </div>
                  </>
                )}

                <div className="lux-mini-bill-row deposit">
                  <span>Tiền cọc</span>
                  <strong>{formatMoney(deposit.depositAmount)}</strong>
                </div>
                <div className="lux-mini-bill-row remain">
                  <span>Còn phải thanh toán</span>
                  <strong>{formatMoney(deposit.remainingAmount)}</strong>
                </div>
              </div>

              <div className="lux-note-box side-note">
                <div>
                  <strong>Ngày nhận xe:</strong> {deposit.pickupDate || "Chưa có"}
                </div>
                <div>
                  <strong>Khung giờ:</strong>{" "}
                  {deposit.pickupTimeSlot || "Chưa có"}
                </div>
                <div>
                  <strong>Hình thức nhận:</strong>{" "}
                  {getDeliveryMethodLabel(deposit.deliveryMethod)}
                </div>
                <div>
                  <strong>Showroom:</strong> {deposit.showroom || "Không có"}
                </div>
              </div>
            </aside>
          </div>
        </div>

        {message && <div className="deposit-detail-state-box">{message}</div>}

        {previewOpen && deposit.invoiceImage && (
          <div
            className="lux-preview-overlay"
            onClick={() => setPreviewOpen(false)}
          >
            <div
              className="lux-preview-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="lux-preview-close"
                onClick={() => setPreviewOpen(false)}
              >
                ×
              </button>

              <img
                className="lux-preview-large-image"
                src={getInvoiceImageSrc()}
                alt="Hóa đơn lớn"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}