import { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import "../../styles/admin/AdminRevenue.css";

const formatMoney = (value) => Number(value || 0).toLocaleString("vi-VN") + "đ";

const statusLabel = {
  pending_payment: "Chờ thanh toán cọc",
  paid: "Đã thanh toán cọc",
  confirmed: "Đã xác nhận cọc",
  waiting_full_payment: "Chờ thanh toán phần còn lại",
  ready_to_deliver: "Đã thanh toán đủ",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  refunded: "Đã hoàn cọc",
};

const pieColors = ["#2563eb", "#f59e0b"];

export default function AdminRevenue() {
  const today = new Date();
  const [type, setType] = useState("day");
  const [date, setDate] = useState(today.toISOString().slice(0, 10));
  const [month, setMonth] = useState(String(today.getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(today.getFullYear()));

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [charts, setCharts] = useState({ monthlyRevenue: [], dailyRevenue: [], pieRevenue: [] });

  const getDiscountTotal = (dataRows) =>
    (dataRows || []).reduce((sum, item) => sum + Number(item.discountAmount || 0), 0);

  const hasVoucher = (item) =>
    !!item.promotionId || !!item.promotionTitle || Number(item.discountAmount || 0) > 0;

  const getFinalPrice = (item) => {
    if (Number(item.finalEstimatedPrice || 0) > 0) return Number(item.finalEstimatedPrice);
    return Math.max(Number(item.totalEstimatedPrice || 0) - Number(item.discountAmount || 0), 0);
  };

  const buildSavePayload = () => {
    if (type === "day") return { type: "day", date, year: Number(year), note: `Lưu báo cáo doanh thu ngày ${date}` };
    if (type === "month") return { type: "month", month: Number(month), year: Number(year), note: `Lưu báo cáo doanh thu tháng ${month}/${year}` };
    return { type: "year", year: Number(year), note: `Lưu báo cáo doanh thu năm ${year}` };
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = { type };
      if (type === "day") { params.date = date; params.year = Number(year); }
      else if (type === "month") { params.month = Number(month); params.year = Number(year); }
      else if (type === "year") { params.year = Number(year); }

      const res = await axios.get("https://webbanxe-backend-stx9.onrender.com/api/reports/revenue", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setSummary(res.data.summary || null);
      setRows(res.data.rows || []);
      setCharts(res.data.charts || { monthlyRevenue: [], dailyRevenue: [], pieRevenue: [] });
    } catch (error) {
      console.error("Lỗi lấy báo cáo doanh thu:", error);
      setSummary(null);
      setRows([]);
      setCharts({ monthlyRevenue: [], dailyRevenue: [], pieRevenue: [] });
      alert(error?.response?.data?.message || "Không lấy được báo cáo doanh thu");
    } finally {
      setLoading(false);
    }
  };

  const saveRevenueReport = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "https://webbanxe-backend-stx9.onrender.com/api/reports/revenue/save",
        buildSavePayload(),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || "Lưu báo cáo doanh thu thành công");
    } catch (error) {
      alert(error?.response?.data?.message || "Không lưu được báo cáo doanh thu");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  return (
    <div className="admin-revenue-page">
      <div className="revenue-topbar">
        <div>
          <h1>Báo cáo doanh thu</h1>
          <p>Thống kê doanh thu theo ngày, tháng, năm với biểu đồ trực quan</p>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button className="revenue-primary-btn" onClick={fetchReport}>Làm mới</button>
          <button
            className="revenue-primary-btn"
            onClick={saveRevenueReport}
            disabled={saving || loading}
            style={{ background: saving ? "#9ca3af" : "#16a34a", borderColor: saving ? "#9ca3af" : "#16a34a" }}
          >
            {saving ? "Đang lưu..." : "Lưu báo cáo"}
          </button>
        </div>
      </div>

      <div className="revenue-filter-card">
        <div className="revenue-filter-group">
          <label>Loại báo cáo</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="day">Theo ngày</option>
            <option value="month">Theo tháng</option>
            <option value="year">Theo năm</option>
          </select>
        </div>
        {type === "day" && (
          <div className="revenue-filter-group">
            <label>Ngày</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        )}
        {type === "month" && (
          <div className="revenue-filter-group">
            <label>Tháng</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => {
                const m = String(i + 1).padStart(2, "0");
                return <option key={m} value={m}>Tháng {m}</option>;
              })}
            </select>
          </div>
        )}
        <div className="revenue-filter-group">
          <label>Năm</label>
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div className="revenue-filter-actions">
          <button className="revenue-primary-btn" onClick={fetchReport}>Xem báo cáo</button>
        </div>
      </div>

      <div className="revenue-summary-grid">
        <div className="revenue-summary-card blue"><span>Doanh thu tiền cọc</span><h2>{formatMoney(summary?.depositRevenue)}</h2></div>
        <div className="revenue-summary-card amber"><span>Doanh thu thanh toán đủ</span><h2>{formatMoney(summary?.fullPaymentRevenue)}</h2></div>
        <div className="revenue-summary-card dark"><span>Tổng doanh thu</span><h2>{formatMoney(summary?.totalRevenue)}</h2></div>
        <div className="revenue-summary-card green"><span>Tổng giảm giá</span><h2>{formatMoney(getDiscountTotal(rows))}</h2></div>
      </div>

      <div className="revenue-chart-grid">
        <div className="chart-card large">
          <div className="chart-card-header"><h3>Doanh thu 12 tháng</h3><p>Theo năm {year}</p></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={charts.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1000000)}tr`} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Legend />
                <Bar dataKey="depositRevenue" name="Tiền cọc" radius={[8, 8, 0, 0]} />
                <Bar dataKey="fullPaymentRevenue" name="Thanh toán đủ" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-card small">
          <div className="chart-card-header"><h3>Cơ cấu doanh thu</h3><p>Trong kỳ đang chọn</p></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={charts.pieRevenue} cx="50%" cy="50%" outerRadius={110} dataKey="value" nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {charts.pieRevenue.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {type === "month" && (
        <div className="chart-card full-width">
          <div className="chart-card-header">
            <h3>Xu hướng doanh thu theo ngày trong tháng {month}/{year}</h3>
            <p>Thể hiện biến động doanh thu từng ngày</p>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={charts.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1000000)}tr`} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Legend />
                <Line type="monotone" dataKey="depositRevenue" name="Tiền cọc" stroke="#2563eb" strokeWidth={3} />
                <Line type="monotone" dataKey="fullPaymentRevenue" name="Thanh toán đủ" stroke="#f59e0b" strokeWidth={3} />
                <Line type="monotone" dataKey="revenue" name="Tổng doanh thu" stroke="#111827" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="revenue-table-card">
        <div className="chart-card-header"><h3>Chi tiết doanh thu</h3><p>Danh sách các đơn phát sinh tiền trong kỳ</p></div>
        <div className="revenue-table-wrapper">
          <table className="revenue-table">
            <thead>
              <tr>
                <th>Khách hàng</th><th>Tên xe</th><th>Trạng thái</th><th>Voucher</th>
                <th>Giảm giá</th><th>Giá sau ưu đãi</th><th>Tiền cọc</th><th>Tiền còn lại</th>
                <th>Thu cọc trong kỳ</th><th>Thu phần còn lại</th><th>Ngày cọc</th><th>Ngày thanh toán đủ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="12" className="empty-cell">Đang tải dữ liệu...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="12" className="empty-cell">Không có dữ liệu doanh thu</td></tr>
              ) : (
                rows.map((item) => (
                  <tr key={item._id || item.depositId}>
                    <td>{item.customerName}</td>
                    <td>{item.carName}</td>
                    <td>{statusLabel[item.status] || item.status}</td>
                    <td>{hasVoucher(item) ? item.promotionTitle || "Ưu đãi áp dụng" : "-"}</td>
                    <td style={hasVoucher(item) ? { color: "#dc2626", fontWeight: 700 } : {}}>
                      {hasVoucher(item) ? `-${formatMoney(item.discountAmount)}` : "-"}
                    </td>
                    <td style={hasVoucher(item) ? { color: "#ca8a04", fontWeight: 800 } : {}}>
                      {formatMoney(getFinalPrice(item))}
                    </td>
                    <td>{formatMoney(item.depositAmount)}</td>
                    <td>{formatMoney(item.fullPaymentAmount)}</td>
                    <td>{formatMoney(item.depositCollected)}</td>
                    <td>{formatMoney(item.fullCollected)}</td>
                    <td>{item.paidAt ? new Date(item.paidAt).toLocaleString("vi-VN") : "-"}</td>
                    <td>{item.fullyPaidAt ? new Date(item.fullyPaidAt).toLocaleString("vi-VN") : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}