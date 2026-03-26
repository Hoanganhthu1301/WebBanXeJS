import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function UserDepositDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deposit, setDeposit] = useState(null);
  const [message, setMessage] = useState("Đang tải...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `http://localhost:5000/api/deposits/${id}/detail`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDeposit(res.data.deposit || null);
      setMessage("");
    } catch (error) {
      console.error("Lỗi chi tiết đơn user:", error);
      setMessage(
        error?.response?.data?.message || "Không lấy được chi tiết đơn hàng"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + " đ";

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("vi-VN");
  };

  if (loading) {
    return <div style={{ padding: 24 }}>{message}</div>;
  }

  if (!deposit) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate(-1)}>← Quay lại</button>
        <p style={{ marginTop: 16 }}>{message}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: "#f6f7fb", minHeight: "100vh" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 20,
          border: "none",
          background: "#111827",
          color: "#fff",
          padding: "10px 16px",
          borderRadius: 10,
          cursor: "pointer",
        }}
      >
        ← Quay lại
      </button>

      <h1 style={{ fontSize: 32, marginBottom: 20 }}>Chi tiết đơn hàng của tôi</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        <div style={boxStyle}>
          <h3>Thông tin đơn</h3>
          <p><strong>Mã đơn:</strong> {deposit.orderCode || "—"}</p>
          <p><strong>Tên xe:</strong> {deposit.carName || deposit.carId?.name || "—"}</p>
          <p><strong>Ngày tạo:</strong> {formatDate(deposit.createdAt)}</p>
          <p><strong>Trạng thái:</strong> {deposit.status || "—"}</p>
          <p><strong>Ghi chú:</strong> {deposit.note || "—"}</p>
        </div>

        <div style={boxStyle}>
          <h3>Thông tin thanh toán</h3>
          <p><strong>Giá xe:</strong> {formatMoney(deposit.carPrice)}</p>
          <p><strong>Tiền cọc:</strong> {formatMoney(deposit.depositAmount)}</p>
          <p><strong>Còn phải thanh toán:</strong> {formatMoney(deposit.remainingAmount)}</p>
          <p><strong>Tổng dự kiến:</strong> {formatMoney(deposit.totalEstimatedPrice)}</p>
        </div>

        <div style={boxStyle}>
          <h3>Người phụ trách đơn</h3>
          <p>
            <strong>Tên:</strong>{" "}
            {deposit.assignedStaffName ||
              deposit.assignedStaffId?.fullName ||
              deposit.assignedStaffId?.name ||
              "Chưa cập nhật"}
          </p>
          <p><strong>Email:</strong> {deposit.assignedStaffId?.email || "—"}</p>
          <p><strong>SĐT:</strong> {deposit.assignedStaffId?.phone || "—"}</p>
        </div>

        <div style={boxStyle}>
          <h3>Nhận xe</h3>
          <p><strong>Ngày nhận:</strong> {deposit.pickupDate || "—"}</p>
          <p><strong>Khung giờ:</strong> {deposit.pickupTimeSlot || "—"}</p>
          <p><strong>Hình thức:</strong> {deposit.deliveryMethod || "—"}</p>
          <p><strong>Showroom:</strong> {deposit.showroom || "—"}</p>
          <p><strong>Địa chỉ giao:</strong> {deposit.deliveryAddress || "—"}</p>
        </div>
      </div>
    </div>
  );
}

const boxStyle = {
  background: "#fff",
  padding: 20,
  borderRadius: 16,
  boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
};