import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/admin/AdminDeposits.css";

const API_URL = "https://webbanxe-backend-stx9.onrender.com/api/deposits";

const STATUS_LABELS = {
  pending_payment: "Chờ thanh toán cọc",
  paid: "Đã thanh toán cọc",
  confirmed: "Đã xác nhận cọc",
  waiting_full_payment: "Chờ thanh toán phần còn lại",
  ready_to_deliver: "Sẵn sàng giao xe",
  completed: "Đã giao xe",
  cancelled: "Đã hủy",
  refunded: "Đã hoàn cọc",
};

const PAYMENT_STATUS_LABELS = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy thanh toán",
  failed: "Thất bại",
};

export default function AdminDeposits() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const token = localStorage.getItem("token");

  const [deposits, setDeposits] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const authHeaders = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }
    fetchDeposits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      setMessage("");
      const res = await axios.get(API_URL, authHeaders);
      setDeposits(res.data.deposits || []);
    } catch (error) {
      setMessage(
        error?.response?.data?.message || "Không lấy được danh sách đặt cọc"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + " đ";

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("vi-VN");
  };

  const getStatusText = (status) => STATUS_LABELS[status] || status || "—";

  const getPaymentStatusText = (status) =>
    PAYMENT_STATUS_LABELS[status] || status || "—";

  const getCustomerName = (item) =>
    item.fullName || item.userId?.fullName || item.userId?.name || "—";

  const getCarName = (item) => item.carName || item.carId?.name || "—";

  const getStaffName = (item) =>
    item.assignedStaffName ||
    item.assignedStaffId?.fullName ||
    item.assignedStaffId?.name ||
    "Chưa gán";

  const hasVoucher = (item) =>
    !!item.promotionId ||
    !!item.promotionTitle ||
    Number(item.discountAmount || 0) > 0;

  const getFinalPrice = (item) => {
    if (Number(item.finalEstimatedPrice || 0) > 0) {
      return Number(item.finalEstimatedPrice);
    }
    return Math.max(
      Number(item.totalEstimatedPrice || 0) - Number(item.discountAmount || 0),
      0
    );
  };

  const filteredDeposits = useMemo(() => {
    const kw = keyword.trim().toLowerCase();

    return deposits.filter((item) => {
      const matchStatus =
        statusFilter === "all" ? true : item.status === statusFilter;

      const searchableText = [
        item.orderCode,
        getCustomerName(item),
        item.phone,
        item.email,
        getCarName(item),
        getStaffName(item),
        item.status,
        item.paymentStatus,
        item.promotionTitle,
      ]
        .join(" ")
        .toLowerCase();

      const matchKeyword = kw ? searchableText.includes(kw) : true;

      return matchStatus && matchKeyword;
    });
  }, [deposits, keyword, statusFilter]);

  const handleViewDetail = (id) => {
    navigate(`/admin/deposits/${id}`);
  };

  const handleAssignToMe = async (id) => {
    if (!user?._id && !user?.id) {
      setMessage("Không tìm thấy thông tin tài khoản admin");
      return;
    }

    try {
      setMessage("");
      await axios.put(
        `${API_URL}/${id}/assign`,
        { staffId: user._id || user.id },
        authHeaders
      );
      await fetchDeposits();
      setMessage("Đã nhận phụ trách đơn");
    } catch (error) {
      setMessage(
        error?.response?.data?.message || "Gán người phụ trách thất bại"
      );
    }
  };

  const handleCancelDeposit = async (id) => {
    const reason = window.prompt("Nhập lý do admin hủy đơn:");
    if (!reason) return;

    try {
      setMessage("");
      const res = await axios.put(
        `${API_URL}/${id}/cancel`,
        { reason },
        authHeaders
      );
      await fetchDeposits();
      setMessage(res.data?.message || "Đã hủy đơn đặt cọc");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Hủy đơn thất bại");
    }
  };

  const handleConfirmByStaff = async (id) => {
    try {
      setMessage("");
      await axios.put(`${API_URL}/${id}/confirm-by-staff`, {}, authHeaders);
      await fetchDeposits();
      setMessage("Đã xác nhận cọc thành công");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Xác nhận cọc thất bại");
    }
  };

  const handleConfirmFullPayment = async (
    id,
    fullPaymentMethod = "bank_transfer"
  ) => {
    try {
      setMessage("");
      await axios.put(
        `${API_URL}/${id}/full-payment`,
        { fullPaymentMethod },
        authHeaders
      );
      await fetchDeposits();
      setMessage("Đã xác nhận khách thanh toán đủ");
    } catch (error) {
      setMessage(
        error?.response?.data?.message || "Xác nhận thanh toán đủ thất bại"
      );
    }
  };

  const handleCompleteOrder = async (id) => {
    try {
      setMessage("");
      await axios.put(`${API_URL}/${id}/complete`, {}, authHeaders);
      await fetchDeposits();
      setMessage("Đã hoàn tất giao xe");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Hoàn tất đơn thất bại");
    }
  };

  const renderActionButtons = (item) => {
    const isCancelled = item.status === "cancelled";
    const isCompleted = item.status === "completed";
    const isRefunded = item.status === "refunded";

    const canAssign =
      !item.assignedStaffId && !isCancelled && !isCompleted && !isRefunded;

    const canCancel =
      !["cancelled", "completed", "refunded"].includes(item.status);

    const canConfirmDeposit =
      item.paymentStatus === "paid" && item.status === "paid";

    const canConfirmFullPayment =
      item.status === "waiting_full_payment" || item.status === "confirmed";

    const canComplete = item.status === "ready_to_deliver";

    return (
      <div className="admin-deposits-actions">
        <button
          type="button"
          className="admin-deposits-btn admin-deposits-btn-detail"
          onClick={() => handleViewDetail(item._id)}
        >
          Chi tiết
        </button>

        {canAssign && (
          <button
            type="button"
            className="admin-deposits-btn"
            onClick={() => handleAssignToMe(item._id)}
          >
            Nhận phụ trách
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            className="admin-deposits-btn admin-deposits-btn-delete"
            onClick={() => handleCancelDeposit(item._id)}
          >
            Hủy đơn
          </button>
        )}

        {canConfirmDeposit && (
          <button
            type="button"
            className="admin-deposits-btn admin-deposits-btn-confirm"
            onClick={() => handleConfirmByStaff(item._id)}
          >
            Xác nhận cọc
          </button>
        )}

        {canConfirmFullPayment && (
          <>
            <button
              type="button"
              className="admin-deposits-btn admin-deposits-btn-paid"
              onClick={() =>
                handleConfirmFullPayment(item._id, "bank_transfer")
              }
            >
              Đủ tiền CK
            </button>
            <button
              type="button"
              className="admin-deposits-btn admin-deposits-btn-paid"
              onClick={() => handleConfirmFullPayment(item._id, "cash")}
            >
              Đủ tiền mặt
            </button>
          </>
        )}

        {canComplete && (
          <button
            type="button"
            className="admin-deposits-btn admin-deposits-btn-complete"
            onClick={() => handleCompleteOrder(item._id)}
          >
            Giao xe xong
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="admin-deposits-page">
      <div className="admin-deposits-header">
        <div>
          <h2>Quản lý đơn đặt cọc / bán xe</h2>
          <p>Theo dõi đơn cọc, người phụ trách, thanh toán, voucher và giao xe</p>
        </div>

        <button
          type="button"
          className="admin-deposits-refresh"
          onClick={fetchDeposits}
        >
          Tải lại
        </button>
      </div>

      {message && <div className="admin-deposits-message">{message}</div>}

      <div className="admin-deposits-toolbar">
        <input
          type="text"
          placeholder="Tìm mã đơn, khách hàng, xe, voucher, người phụ trách..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="admin-deposits-search"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-deposits-filter"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending_payment">Chờ thanh toán cọc</option>
          <option value="paid">Đã thanh toán cọc</option>
          <option value="confirmed">Đã xác nhận cọc</option>
          <option value="waiting_full_payment">Chờ thanh toán phần còn lại</option>
          <option value="ready_to_deliver">Sẵn sàng giao xe</option>
          <option value="completed">Đã giao xe</option>
          <option value="cancelled">Đã hủy</option>
          <option value="refunded">Đã hoàn cọc</option>
        </select>
      </div>

      <div className="admin-deposits-summary">
        <div className="admin-deposits-summary-card">
          <span>Tổng đơn</span>
          <strong>{deposits.length}</strong>
        </div>

        <div className="admin-deposits-summary-card">
          <span>Đang chờ xử lý</span>
          <strong>
            {
              deposits.filter((x) =>
                ["pending_payment", "paid", "waiting_full_payment"].includes(
                  x.status
                )
              ).length
            }
          </strong>
        </div>

        <div className="admin-deposits-summary-card">
          <span>Có voucher</span>
          <strong>
            {deposits.filter((x) => hasVoucher(x)).length}
          </strong>
        </div>

        <div className="admin-deposits-summary-card">
          <span>Đã hoàn tất</span>
          <strong>
            {deposits.filter((x) => x.status === "completed").length}
          </strong>
        </div>
      </div>

      <div className="admin-deposits-table-wrap">
        <table className="admin-deposits-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Xe / Voucher</th>
              <th>Tiền cọc</th>
              <th>Còn lại</th>
              <th>Thanh toán cọc</th>
              <th>Trạng thái đơn</th>
              <th>Người phụ trách</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" className="admin-deposits-empty">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filteredDeposits.length === 0 ? (
              <tr>
                <td colSpan="10" className="admin-deposits-empty">
                  Không có đơn nào
                </td>
              </tr>
            ) : (
              filteredDeposits.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div className="admin-deposits-order-code">
                      {item.orderCode || "—"}
                    </div>
                  </td>

                  <td>
                    <div className="admin-deposits-main-text">
                      {getCustomerName(item)}
                    </div>
                    <div className="admin-deposits-sub-text">
                      {item.phone || "—"}
                    </div>
                    <div className="admin-deposits-sub-text">
                      {item.email || "—"}
                    </div>
                  </td>

                  <td>
                    <div className="admin-deposits-main-text">
                      {getCarName(item)}
                    </div>

                    {!hasVoucher(item) && (
                      <div className="admin-deposits-sub-text">
                        Giá xe: {formatMoney(item.carPrice)}
                      </div>
                    )}

                    {hasVoucher(item) && (
                      <>
                        <div
                          className="admin-deposits-sub-text"
                          style={{
                            textDecoration: "line-through",
                            opacity: 0.7,
                          }}
                        >
                          Giá gốc: {formatMoney(item.carPrice)}
                        </div>
                        <div
                          className="admin-deposits-sub-text"
                          style={{ color: "#0f766e", fontWeight: 700 }}
                        >
                          Voucher: {item.promotionTitle || "Ưu đãi áp dụng"}
                        </div>
                        <div
                          className="admin-deposits-sub-text"
                          style={{ color: "#dc2626", fontWeight: 700 }}
                        >
                          Giảm: -{formatMoney(item.discountAmount)}
                        </div>
                        <div
                          className="admin-deposits-sub-text"
                          style={{ color: "#ca8a04", fontWeight: 800 }}
                        >
                          Giá sau giảm: {formatMoney(getFinalPrice(item))}
                        </div>
                      </>
                    )}
                  </td>

                  <td>{formatMoney(item.depositAmount)}</td>
                  <td>{formatMoney(item.remainingAmount)}</td>

                  <td>
                    <span
                      className={`admin-deposits-badge payment-${item.paymentStatus}`}
                    >
                      {getPaymentStatusText(item.paymentStatus)}
                    </span>
                    <div className="admin-deposits-sub-text">
                      {formatDate(item.paidAt)}
                    </div>
                  </td>

                  <td>
                    <span
                      className={`admin-deposits-badge status-${item.status}`}
                    >
                      {getStatusText(item.status)}
                    </span>
                  </td>

                  <td>
                    <div className="admin-deposits-main-text">
                      {getStaffName(item)}
                    </div>
                    <div className="admin-deposits-sub-text">
                      {item.assignedStaffId?.phone || "—"}
                    </div>
                  </td>

                  <td>{formatDate(item.createdAt)}</td>

                  <td>{renderActionButtons(item)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}