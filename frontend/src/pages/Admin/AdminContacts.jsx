import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/admin/AdminContacts.css";

const tabs = [
  { key: "all", label: "Tất cả" },
  { key: "consultation", label: "Tư vấn" },
  { key: "quotation", label: "Báo giá" },
  { key: "view", label: "Xem xe" },
  { key: "test_drive", label: "Lái thử" },
];

export default function AdminContacts() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyStatus, setReplyStatus] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const results = await Promise.allSettled([
        axios.get("https://webbanxe-backend-stx9.onrender.com/api/contacts"),
        axios.get("https://webbanxe-backend-stx9.onrender.com/api/quotations"),
        axios.get("https://webbanxe-backend-stx9.onrender.com/api/appointments"),
      ]);

      const contactRes = results[0].status === "fulfilled" ? results[0].value.data : { contacts: [] };
      const quotationRes = results[1].status === "fulfilled" ? results[1].value.data : { quotations: [] };
      const appointmentRes = results[2].status === "fulfilled" ? results[2].value.data : { appointments: [] };

      const contacts = (contactRes.contacts || []).map((item) => ({
        ...item,
        requestType: "consultation",
        requestTypeLabel: "Tư vấn",
      }));

      const quotations = (quotationRes.quotations || []).map((item) => ({
        ...item,
        requestType: "quotation",
        requestTypeLabel: "Báo giá",
      }));

      const appointments = (appointmentRes.appointments || []).map((item) => ({
        ...item,
        requestType: item.type === "test_drive" ? "test_drive" : "view",
        requestTypeLabel: item.type === "test_drive" ? "Lái thử" : "Xem xe",
      }));

      const merged = [...contacts, ...quotations, ...appointments].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setRequests(merged);

      const failedApis = [];
      if (results[0].status === "rejected") failedApis.push("tư vấn");
      if (results[1].status === "rejected") failedApis.push("báo giá");
      if (results[2].status === "rejected") failedApis.push("lịch hẹn");

      if (failedApis.length > 0) {
        setMessage(`Một số dữ liệu chưa tải được: ${failedApis.join(", ")}`);
      } else {
        setMessage("");
      }
    } catch (error) {
      setMessage("Không lấy được danh sách yêu cầu");
    }
  };

  const filteredRequests = useMemo(() => {
    if (activeTab === "all") return requests;
    return requests.filter((item) => item.requestType === activeTab);
  }, [activeTab, requests]);

  const handleOpenDetailModal = (item) => {
    setDetailRequest(item);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailRequest(null);
    setDetailModalOpen(false);
  };

  const handleDelete = async (item) => {
    const ok = window.confirm("Bạn có chắc muốn xóa yêu cầu này không?");
    if (!ok) return;

    try {
      if (item.requestType === "consultation") {
        await axios.delete(`https://webbanxe-backend-stx9.onrender.com/api/contacts/${item._id}`);
      } else if (item.requestType === "quotation") {
        await axios.delete(`https://webbanxe-backend-stx9.onrender.com/api/quotations/${item._id}`);
      } else {
        await axios.delete(`https://webbanxe-backend-stx9.onrender.com/api/appointments/${item._id}`);
      }

      setMessage("Xóa yêu cầu thành công");
      fetchRequests();
    } catch (error) {
      setMessage(error.response?.data?.message || "Xóa yêu cầu thất bại");
    }
  };

  const handleOpenReplyModal = (item) => {
    setSelectedRequest(item);
    setReplyStatus(item.status || "");
    setReplyContent(item.adminReply || "");
    setReplyModalOpen(true);
  };

  const handleCloseReplyModal = () => {
    setSelectedRequest(null);
    setReplyModalOpen(false);
    setReplyStatus("");
    setReplyContent("");
  };

  const handleSendReply = async () => {
    if (!selectedRequest) return;

    try {
      if (!replyContent.trim()) {
        setMessage("Vui lòng nhập nội dung phản hồi trước khi gửi");
        return;
      }

      setSendingReply(true);

      if (selectedRequest.requestType === "consultation") {
        await axios.put(`https://webbanxe-backend-stx9.onrender.com/api/contacts/${selectedRequest._id}`, {
          status: replyStatus,
          adminReply: replyContent,
        });
      } else if (selectedRequest.requestType === "quotation") {
        await axios.put(`https://webbanxe-backend-stx9.onrender.com/api/quotations/${selectedRequest._id}`, {
          status: replyStatus,
          adminReply: replyContent,
        });
      } else {
        await axios.put(`https://webbanxe-backend-stx9.onrender.com/api/appointments/${selectedRequest._id}`, {
          status: replyStatus,
          adminReply: replyContent,
        });
      }

      alert("Gửi phản hồi thành công");
      handleCloseReplyModal();
      fetchRequests();
      setMessage("Phản hồi đã được lưu và gửi cho khách hàng");
    } catch (error) {
      setMessage(error.response?.data?.message || "Gửi phản hồi thất bại");
    } finally {
      setSendingReply(false);
    }
  };

  const getThumb = (item) => {
    const car = item.carId;
    if (!car) return "https://via.placeholder.com/100x70?text=No+Image";
    if (car.image && car.image.trim() !== "") return car.image;
    if (Array.isArray(car.images) && car.images.length > 0) return car.images[0];
    return "https://via.placeholder.com/100x70?text=No+Image";
  };

  const getStatusOptions = (item) => {
    if (item.requestType === "consultation") {
      return [
        { value: "new", label: "Mới" },
        { value: "processing", label: "Đang xử lý" },
        { value: "contacted", label: "Đã liên hệ" },
      ];
    }
    if (item.requestType === "quotation") {
      return [
        { value: "new", label: "Mới" },
        { value: "quoted", label: "Đã báo giá" },
        { value: "done", label: "Hoàn tất" },
      ];
    }
    return [
      { value: "pending", label: "Chờ xác nhận" },
      { value: "confirmed", label: "Đã xác nhận" },
      { value: "done", label: "Hoàn tất" },
      { value: "cancelled", label: "Đã hủy" },
    ];
  };

  const getStatusLabel = (item) => {
    return (
      getStatusOptions(item).find((opt) => opt.value === item.status)?.label ||
      item.status ||
      "—"
    );
  };

  const getStatusBadgeStyle = (item) => {
    const status = item.status;
    if (status === "contacted" || status === "quoted" || status === "done") {
      return { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" };
    }
    if (status === "processing" || status === "confirmed") {
      return { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" };
    }
    if (status === "cancelled") {
      return { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" };
    }
    return { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" };
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="admin-contacts-page">
      <div className="admin-contacts-header">
        <h1>Yêu cầu của khách hàng</h1>
        <p>Phân loại theo tư vấn, báo giá, xem xe và lái thử</p>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "10px 18px",
              borderRadius: "999px",
              border: activeTab === tab.key ? "none" : "1px solid #d1d5db",
              background: activeTab === tab.key ? "#2563eb" : "#fff",
              color: activeTab === tab.key ? "#fff" : "#111827",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message && <p className="message-text">{message}</p>}

      <div className="admin-contacts-box">
        <div className="contacts-table-wrapper">
          <table className="contacts-table">
            <thead>
              <tr>
                <th>Ảnh xe</th>
                <th>Loại yêu cầu</th>
                <th>Khách hàng</th>
                <th>Liên hệ</th>
                <th>Xe quan tâm</th>
                <th>Nội dung</th>
                <th>Thông tin thêm</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((item) => (
                  <tr key={`${item.requestType}-${item._id}`}>
                    <td>
                      <img
                        src={getThumb(item)}
                        alt={item.carName}
                        className="contact-thumb"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/100x70?text=No+Image";
                        }}
                      />
                    </td>
                    <td><strong>{item.requestTypeLabel}</strong></td>
                    <td>
                      <strong>
                        {[item.lastName, item.firstName].filter(Boolean).join(" ")}
                      </strong>
                    </td>
                    <td>
                      <div><strong>SĐT:</strong> {item.phone || "—"}</div>
                      <div><strong>Email:</strong> {item.email || "—"}</div>
                      {item.preferredContact && (
                        <div>
                          <strong>Ưu tiên:</strong>{" "}
                          {item.preferredContact === "email" ? "Email" : "Gọi điện"}
                        </div>
                      )}
                    </td>
                    <td>
                      <div><strong>{item.carName}</strong></div>
                      <div>{item.carId?.brand || "—"}</div>
                      <div>{item.carId?.category || "—"}</div>
                    </td>
                    <td>{item.additionalInfo || "—"}</td>
                    <td>
                      {item.requestType === "quotation" && (
                        <div><strong>Khu vực:</strong> {item.province || "—"}</div>
                      )}
                      {(item.requestType === "view" || item.requestType === "test_drive") && (
                        <>
                          <div><strong>Ngày:</strong> {item.appointmentDate || "—"}</div>
                          <div><strong>Giờ:</strong> {item.appointmentTime || "—"}</div>
                          <div><strong>Địa điểm:</strong> {item.location || "—"}</div>
                        </>
                      )}
                    </td>
                    <td>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString("vi-VN")
                        : "—"}
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "110px",
                          padding: "8px 12px",
                          borderRadius: "999px",
                          fontWeight: 700,
                          fontSize: "13px",
                          ...getStatusBadgeStyle(item),
                        }}
                      >
                        {getStatusLabel(item)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(item)}
                          style={{
                            border: "none", borderRadius: "12px", padding: "10px 14px",
                            background: "#111827", color: "#fff", fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center",
                            justifyContent: "center", gap: "8px",
                          }}
                        >
                          <span>👁</span><span>Chi tiết</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReplyModal(item)}
                          style={{
                            border: "none", borderRadius: "12px", padding: "10px 14px",
                            background: "#2563eb", color: "#fff", fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center",
                            justifyContent: "center", gap: "8px",
                          }}
                        >
                          <span>✉</span><span>Phản hồi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          style={{
                            border: "1px solid #fecaca", borderRadius: "12px", padding: "10px 14px",
                            background: "#fef2f2", color: "#dc2626", fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center",
                            justifyContent: "center", gap: "8px",
                          }}
                        >
                          <span>🗑</span><span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center" }}>
                    Chưa có yêu cầu nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailModalOpen && detailRequest && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9998, padding: "20px",
          }}
          onClick={handleCloseDetailModal}
        >
          <div
            style={{
              width: "100%", maxWidth: "760px", background: "#fff",
              borderRadius: "20px", padding: "24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div>
                <h2 style={{ margin: 0 }}>Chi tiết yêu cầu</h2>
                <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                  {detailRequest.requestTypeLabel} • {detailRequest.carName}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseDetailModal}
                style={{ border: "none", background: "transparent", fontSize: "28px", cursor: "pointer", lineHeight: 1 }}
              >×</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "20px", alignItems: "start" }}>
              <img
                src={getThumb(detailRequest)}
                alt={detailRequest.carName}
                style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "14px", border: "1px solid #e5e7eb" }}
                onError={(e) => { e.target.src = "https://via.placeholder.com/300x200?text=No+Image"; }}
              />
              <div style={{ display: "grid", gap: "10px" }}>
                <div><strong>Loại:</strong> {detailRequest.requestTypeLabel}</div>
                <div><strong>Khách hàng:</strong> {[detailRequest.lastName, detailRequest.firstName].filter(Boolean).join(" ")}</div>
                <div><strong>SĐT:</strong> {detailRequest.phone || "—"}</div>
                <div><strong>Email:</strong> {detailRequest.email || "—"}</div>
                <div><strong>Xe:</strong> {detailRequest.carName || "—"}</div>
                <div><strong>Trạng thái:</strong> {getStatusLabel(detailRequest)}</div>
                <div><strong>Ngày gửi:</strong> {detailRequest.createdAt ? new Date(detailRequest.createdAt).toLocaleString("vi-VN") : "—"}</div>
                <div>
                  <strong>Nội dung:</strong>
                  <div style={{ marginTop: "6px", padding: "12px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                    {detailRequest.additionalInfo || "Không có nội dung"}
                  </div>
                </div>
                <div>
                  <strong>Phản hồi hiện tại:</strong>
                  <div style={{ marginTop: "6px", padding: "12px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                    {detailRequest.adminReply || "Chưa có phản hồi"}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
              <button type="button" onClick={handleCloseDetailModal}
                style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", fontWeight: 600 }}>
                Đóng
              </button>
              <button type="button"
                onClick={() => { handleCloseDetailModal(); handleOpenReplyModal(detailRequest); }}
                style={{ border: "none", background: "#2563eb", color: "#fff", borderRadius: "10px", padding: "10px 18px", cursor: "pointer", fontWeight: 700 }}>
                Phản hồi ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {replyModalOpen && selectedRequest && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, padding: "20px",
          }}
          onClick={handleCloseReplyModal}
        >
          <div
            style={{
              width: "100%", maxWidth: "720px", background: "#fff",
              borderRadius: "20px", padding: "24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div>
                <h2 style={{ margin: 0 }}>Phản hồi yêu cầu</h2>
                <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                  {selectedRequest.requestTypeLabel} • {selectedRequest.carName}
                </p>
              </div>
              <button type="button" onClick={handleCloseReplyModal}
                style={{ border: "none", background: "transparent", fontSize: "28px", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              <div style={{ padding: "14px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                <div><strong>Khách hàng:</strong> {[selectedRequest.lastName, selectedRequest.firstName].filter(Boolean).join(" ")}</div>
                <div><strong>Email:</strong> {selectedRequest.email || "—"}</div>
                <div><strong>SĐT:</strong> {selectedRequest.phone || "—"}</div>
                <div><strong>Nội dung:</strong> {selectedRequest.additionalInfo || "—"}</div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Trạng thái</label>
                <select value={replyStatus} onChange={(e) => setReplyStatus(e.target.value)}
                  style={{ width: "100%", height: "46px", borderRadius: "12px", border: "1px solid #d1d5db", padding: "0 12px" }}>
                  {getStatusOptions(selectedRequest).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Nội dung phản hồi gửi tới khách hàng</label>
                <textarea
                  rows="6"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Nhập nội dung phản hồi để gửi email cho khách hàng..."
                  style={{ width: "100%", borderRadius: "12px", border: "1px solid #d1d5db", padding: "12px", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button type="button" onClick={handleCloseReplyModal}
                  style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", fontWeight: 600 }}>
                  Hủy
                </button>
                <button type="button" onClick={handleSendReply} disabled={sendingReply}
                  style={{
                    border: "none", background: sendingReply ? "#93c5fd" : "#2563eb",
                    color: "#fff", borderRadius: "10px", padding: "10px 18px",
                    cursor: sendingReply ? "not-allowed" : "pointer", fontWeight: 700,
                  }}>
                  {sendingReply ? "Đang gửi..." : "Gửi phản hồi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}