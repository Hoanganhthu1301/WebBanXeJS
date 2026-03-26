import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MainNavbar from "../../components/MainNavbar";
import "../../styles/user/MyDepositsPage.css";

export default function MyDepositsPage() {
  const navigate = useNavigate();

  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("deposit");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchMyDeposits();
  }, []);

  const fetchMyDeposits = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/deposits/my-deposits",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDeposits(res.data.deposits || []);
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Không lấy được danh sách đơn đặt cọc"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUserCancel = async (id) => {
    const confirm = window.confirm("Bạn chắc chắn muốn hủy đơn này?");
    if (!confirm) return;

    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/deposits/${id}/user-cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchMyDeposits();
    } catch (error) {
      alert(error.response?.data?.message || "Không hủy được đơn");
    }
  };

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("vi-VN") + "đ";
  };

  const formatDate = (value) => {
    if (!value) return "Không rõ";
    return new Date(value).toLocaleString("vi-VN");
  };

  const getStatusText = (deposit) => {
    if (deposit.status === "completed") return "Đã mua";
    if (deposit.status === "cancelled") return "Đã hủy";

    if (deposit.paymentStatus === "paid") return "Đã thanh toán cọc";
    if (deposit.paymentStatus === "cancelled") return "Đã hủy thanh toán";

    return "Chờ thanh toán";
  };

  const getStatusClass = (deposit) => {
    if (deposit.status === "completed") return "status-completed";
    if (deposit.status === "cancelled") return "status-cancelled";
    if (deposit.paymentStatus === "paid") return "status-paid";
    return "status-pending";
  };

  const getRemainingAmount = (deposit) => {
    const total = Number(deposit.carPrice || 0);
    const paid = Number(deposit.depositAmount || 0);
    return Math.max(total - paid, 0);
  };

  const getRefundText = (deposit) => {
    if (deposit.refundStatus === "refunded") return "Đã hoàn cọc";
    if (deposit.refundStatus === "forfeited") return "Mất cọc";
    if (deposit.refundStatus === "pending_refund") return "Đang chờ hoàn cọc";
    return "Không có";
  };

  const depositOrders = useMemo(() => {
    return deposits.filter((item) => item.status !== "completed");
  }, [deposits]);

  const purchasedOrders = useMemo(() => {
    return deposits.filter((item) => item.status === "completed");
  }, [deposits]);

  const currentList = activeTab === "deposit" ? depositOrders : purchasedOrders;

  return (
    <div className="my-orders-page">
      <MainNavbar />

      <div className="my-orders-container">
        <div className="my-orders-header">
          <h1>Đơn hàng của tôi</h1>
          <p>Theo dõi các đơn đã đặt cọc và các xe đã mua</p>
        </div>

        <div className="my-orders-tabs">
          <button
            className={activeTab === "deposit" ? "active" : ""}
            onClick={() => setActiveTab("deposit")}
          >
            Đơn đã đặt cọc ({depositOrders.length})
          </button>

          <button
            className={activeTab === "purchased" ? "active" : ""}
            onClick={() => setActiveTab("purchased")}
          >
            Đơn đã mua ({purchasedOrders.length})
          </button>
        </div>

        {loading && <p className="my-orders-message">Đang tải dữ liệu...</p>}
        {message && <p className="my-orders-message error">{message}</p>}

        {!loading && !message && currentList.length === 0 && (
          <div className="empty-orders">
            {activeTab === "deposit"
              ? "Bạn chưa có đơn đặt cọc nào."
              : "Bạn chưa có đơn mua nào."}
          </div>
        )}

        {!loading && !message && currentList.length > 0 && (
          <div className="orders-horizontal-list">
            {currentList.map((item) => (
              <div className="order-row-card" key={item._id}>
                <div className="order-row-main">
                  <div className="order-row-title">
                    <h3>{item.carName}</h3>
                    <span className={`order-status ${getStatusClass(item)}`}>
                      {getStatusText(item)}
                    </span>
                  </div>

                  <div className="order-row-info">
                    <div>
                      <label>Ngày tạo</label>
                      <p>{formatDate(item.createdAt)}</p>
                    </div>

                    <div>
                      <label>Giá xe</label>
                      <p>{formatMoney(item.carPrice)}</p>
                    </div>

                    <div>
                      <label>Đã cọc</label>
                      <p>{formatMoney(item.depositAmount)}</p>
                    </div>

                    <div>
                      <label>Còn lại</label>
                      <p>{formatMoney(getRemainingAmount(item))}</p>
                    </div>
                  </div>
                </div>

                <div className="order-row-actions">
                  <button onClick={() => setSelectedOrder(item)}>
                    Xem chi tiết
                  </button>

                  {item.status !== "completed" &&
                    item.status !== "cancelled" && (
                      <button
                        className="cancel-btn"
                        onClick={() => handleUserCancel(item._id)}
                      >
                        Hủy đơn
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <div
          className="order-detail-overlay"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="order-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="order-detail-header">
              <h2>Chi tiết đơn hàng</h2>
              <button onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="order-detail-body">
              <div className="detail-box">
                <p><strong>Tên xe:</strong> {selectedOrder.carName}</p>
                <p><strong>Trạng thái:</strong> {getStatusText(selectedOrder)}</p>
                <p><strong>Ngày tạo:</strong> {formatDate(selectedOrder.createdAt)}</p>
                <p><strong>Đã cọc:</strong> {formatMoney(selectedOrder.depositAmount)}</p>
                <p><strong>Còn lại:</strong> {formatMoney(getRemainingAmount(selectedOrder))}</p>
                <p><strong>Hoàn cọc:</strong> {getRefundText(selectedOrder)}</p>
              </div>
            </div>

            <div className="order-detail-footer">
              <button onClick={() => setSelectedOrder(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}