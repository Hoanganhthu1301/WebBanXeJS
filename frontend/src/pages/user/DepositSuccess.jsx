import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import MainNavbar from "../../components/MainNavbar";
import { useTranslation } from 'react-i18next';

export default function DepositSuccess() {
  const { t } = useTranslation();
  const [params] = useSearchParams();

  const orderCode = params.get("orderCode");
  const carId = params.get("carId");

  useEffect(() => {
    const confirmDeposit = async () => {
      if (!orderCode) return;

      try {
        await fetch(
          `https://webbanxe-backend-stx9.onrender.com/api/deposits/order/${orderCode}/confirm`,
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
          <h1 style={{ marginBottom: "12px", color: "#2e7d32" }}>{t('deposit_success_title')}</h1>
          <p style={{ color: "#555", marginBottom: "24px", lineHeight: 1.6 }}>
            {t('deposit_success_desc')}
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
            <p><strong>{t('label_order_id')}:</strong> {orderCode || t('not_available')}</p>
            <p><strong>{t('label_car_id')}:</strong> {carId || t('not_available')}</p>
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
              {t('btn_view_car')}
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
              {t('btn_view_my_deposits')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}