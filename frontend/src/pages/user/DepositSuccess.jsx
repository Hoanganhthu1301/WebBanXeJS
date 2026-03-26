import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import MainNavbar from "../../components/MainNavbar";

export default function DepositSuccess() {
  const [params] = useSearchParams();

  const orderCode = params.get("orderCode");
  const carId = params.get("carId");

  useEffect(() => {
    const confirmDeposit = async () => {
      if (!orderCode) return;

      try {
        await fetch(
          `http://localhost:5000/api/deposits/order/${orderCode}/confirm`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.error("Lỗi cập nhật trạng thái thanh toán:", error);
      }
    };

    confirmDeposit();
  }, [orderCode]);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb" }}>
      <MainNavbar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "640px",
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            padding: "32px",
            textAlign: "center",
            marginTop: "40px",
          }}
        >
          <div style={{ fontSize: "56px", marginBottom: "12px" }}>✅</div>
          <h1 style={{ marginBottom: "12px", color: "#2e7d32" }}>Thanh toán thành công</h1>
          <p style={{ color: "#555", marginBottom: "24px", lineHeight: 1.6 }}>
            Giao dịch đặt cọc đã được ghi nhận. Chúng tôi sẽ liên hệ với bạn sớm.
          </p>

          <div
            style={{
              textAlign: "left",
              background: "#f8f9fa",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "24px",
            }}
          >
            <p><strong>Mã đơn:</strong> {orderCode || "Không có"}</p>
            <p><strong>Mã xe:</strong> {carId || "Không có"}</p>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to={carId ? `/cars/${carId}` : "/"}
              style={{
                background: "#1976d2",
                color: "#fff",
                textDecoration: "none",
                padding: "12px 20px",
                borderRadius: "10px",
                fontWeight: "600",
              }}
            >
              Xem lại xe
            </Link>

            <Link
              to="/my-deposits"
              style={{
                background: "#111827",
                color: "#fff",
                textDecoration: "none",
                padding: "12px 20px",
                borderRadius: "10px",
                fontWeight: "600",
              }}
            >
              Xem đơn của tôi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}