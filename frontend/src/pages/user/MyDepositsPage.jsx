import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MainNavbar from "../../components/MainNavbar";
import { useTranslation } from 'react-i18next';
import "../../styles/user/MyDepositsPage.css";
import PageLoader from "../../components/PageLoader";

export default function MyDepositsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("deposit");

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
        "https://webbanxe-backend-stx9.onrender.com/api/deposits/my-deposits",
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
        error.response?.data?.message || t('msg_fetch_deposits_error')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUserCancel = async (id) => {
    const confirmCancel = window.confirm(t('confirm_cancel_order'));
    if (!confirmCancel) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `https://webbanxe-backend-stx9.onrender.com/api/deposits/${id}/user-cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(res.data?.message || t('msg_cancel_success'));
      fetchMyDeposits();
    } catch (error) {
      alert(error.response?.data?.message || t('msg_cancel_failed'));
    }
  };

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("vi-VN") + "đ";
  };

  const formatDate = (value) => {
    if (!value) return t('unknown');
    return new Date(value).toLocaleString();
  };

  const getStatusText = (deposit) => {
    if (deposit.status === "completed") return t('deposit_status_completed');
    if (deposit.status === "cancelled") return t('deposit_status_cancelled');
    if (deposit.status === "refunded") return t('deposit_status_refunded');
    if (deposit.paymentStatus === "paid") return t('payment_status_paid');
    if (deposit.paymentStatus === "cancelled") return t('payment_status_cancelled');
    return t('deposit_status_pending_payment');
  };

  const getStatusClass = (deposit) => {
    if (deposit.status === "completed") return "status-completed";
    if (deposit.status === "cancelled") return "status-cancelled";
    if (deposit.status === "refunded") return "status-paid";
    if (deposit.paymentStatus === "paid") return "status-paid";
    return "status-pending";
  };

  const getRefundText = (deposit) => {
    if (deposit.refundStatus === "refunded") return t('refund_status_refunded');
    if (deposit.refundStatus === "forfeited") return t('refund_status_forfeited');
    if (deposit.refundStatus === "pending_refund") return t('refund_status_pending');
    return t('not_chosen');
  };

  const hasVoucherApplied = (deposit) => {
    return (
      !!deposit.promotionId ||
      !!deposit.promotionTitle ||
      Number(deposit.discountAmount || 0) > 0
    );
  };

  const getOriginalPrice = (deposit) => {
    return Number(deposit.carPrice || 0);
  };

  const getDiscountedPrice = (deposit) => {
    if (Number(deposit.finalEstimatedPrice || 0) > 0) {
      return Number(deposit.finalEstimatedPrice || 0);
    }
    const original = Number(deposit.carPrice || 0);
    const discount = Number(deposit.discountAmount || 0);
    return Math.max(original - discount, 0);
  };

  const depositOrders = useMemo(() => {
    return deposits.filter((item) => item.status !== "completed");
  }, [deposits]);

  const purchasedOrders = useMemo(() => {
    return deposits.filter((item) => item.status === "completed");
  }, [deposits]);

  const currentList = activeTab === "deposit" ? depositOrders : purchasedOrders;
  if (loading) return <PageLoader />;
  return (
    <div className="my-orders-page">
      <MainNavbar />

      <div className="my-orders-container">
        <div className="my-orders-header">
          <h1>{t('my_orders_title')}</h1>
          <p>{t('my_orders_desc')}</p>
        </div>

        <div className="my-orders-tabs">
          <button
            className={activeTab === "deposit" ? "active" : ""}
            onClick={() => setActiveTab("deposit")}
          >
            {t('tab_deposits')} ({depositOrders.length})
          </button>

          <button
            className={activeTab === "purchased" ? "active" : ""}
            onClick={() => setActiveTab("purchased")}
          >
            {t('tab_purchased')} ({purchasedOrders.length})
          </button>
        </div>

   
        {message && <p className="my-orders-message error">{message}</p>}

        {!loading && !message && currentList.length === 0 && (
          <div className="empty-orders">
            {activeTab === "deposit"
              ? t('empty_deposits')
              : t('empty_purchased')}
          </div>
        )}

        {!loading && !message && currentList.length > 0 && (
          <div className="orders-horizontal-list">
            {currentList.map((item) => (
              <div className="order-row-card" key={item._id}>
                <div className="order-row-top">
                  <h3>{item.carName}</h3>
                </div>

                <div className="order-row-bottom">
                  <div className="order-row-info">
                    <div>
                      <label>{t('label_created_at')}</label>
                      <p>{formatDate(item.createdAt)}</p>
                    </div>

                    <div>
                      <label>{t('label_original_price')}</label>
                      <p>{formatMoney(getOriginalPrice(item))}</p>
                    </div>

                    {hasVoucherApplied(item) ? (
                      <>
                        <div>
                          <label>{t('label_voucher')}</label>
                          <p>{item.promotionTitle || t('promo_default_title')}</p>
                        </div>
                        <div>
                          <label>{t('label_discount_amount')}</label>
                          <p>-{formatMoney(item.discountAmount)}</p>
                        </div>
                        <div>
                          <label>{t('label_price_after_discount')}</label>
                          <p>{formatMoney(getDiscountedPrice(item))}</p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label>{t('label_car_price') || "Giá xe"}</label>
                        <p>{formatMoney(item.carPrice)}</p>
                      </div>
                    )}

                    <div>
                      <label>{t('label_deposit_amount')}</label>
                      <p>{formatMoney(item.depositAmount)}</p>
                    </div>

                    <div>
                      <label>{t('label_remaining_amount')}</label>
                      <p>{formatMoney(item.remainingAmount)}</p>
                    </div>

                    <div>
                      <label>{t('label_refund_status')}</label>
                      <p>{getRefundText(item)}</p>
                    </div>
                  </div>

                  <div className="order-row-side">
                    <span className={`order-status ${getStatusClass(item)}`}>
                      {getStatusText(item)}
                    </span>

                    <div className="order-row-actions">
                      <button onClick={() => navigate(`/my-deposits/${item._id}`)}>
                        {t('btn_view_detail')}
                      </button>

                      {item.status !== "completed" &&
                        item.status !== "cancelled" &&
                        item.status !== "refunded" && (
                          <button
                            className="cancel-btn"
                            onClick={() => handleUserCancel(item._id)}
                          >
                            {t('btn_cancel_order')}
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}