import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../../styles/admin/AdminPromotions.css";

const initialForm = {
  title: "",
  description: "",
  type: "amount",
  value: 0,
  giftItems: "",
  applyScope: "all",
  brand: "",
  carIds: "",
  startDate: "",
  endDate: "",
  status: "active",
};

const toStartOfDayISOString = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toISOString();
};

const toEndOfDayISOString = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(`${dateStr}T23:59:59.999`);
  return date.toISOString();
};

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 900;
  const isTablet = typeof window !== "undefined" && window.innerWidth < 1100;

  const previewValue = useMemo(() => {
    if (form.type === "amount") {
      return `Giảm trực tiếp ${Number(form.value || 0).toLocaleString("vi-VN")}đ`;
    }
    if (form.type === "percent") {
      return `Giảm ${form.value || 0}% giá trị xe`;
    }
    return "Ưu đãi quà tặng";
  }, [form.type, form.value]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://webbanxe-backend-stx9.onrender.com/api/promotions");
      setPromotions(res.data.promotions || []);
      setMessage("");
    } catch (error) {
      setMessage("Không lấy được danh sách ưu đãi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (name === "type") {
        if (value === "gift") {
          next.value = 0;
        } else {
          next.giftItems = "";
        }
      }

      if (name === "applyScope") {
        if (value === "all") {
          next.brand = "";
          next.carIds = "";
        } else if (value === "brand") {
          next.carIds = "";
        } else if (value === "car") {
          next.brand = "";
        }
      }

      return next;
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId("");
  };

  const buildPayload = () => {
    const normalizedTitle = String(form.title || "").trim();
    const normalizedDescription = String(form.description || "").trim();
    const normalizedBrand =
      form.applyScope === "brand"
        ? String(form.brand || "").trim().toLowerCase()
        : "";

    const normalizedGiftItems =
      form.type === "gift"
        ? String(form.giftItems || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : [];

    const normalizedCarIds =
      form.applyScope === "car"
        ? String(form.carIds || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : [];

    return {
      title: normalizedTitle,
      description: normalizedDescription,
      type: form.type,
      value: form.type === "gift" ? 0 : Number(form.value) || 0,
      giftItems: normalizedGiftItems,
      applyScope: form.applyScope,
      brand: normalizedBrand,
      carIds: normalizedCarIds,
      startDate: toStartOfDayISOString(form.startDate),
      endDate: toEndOfDayISOString(form.endDate),
      status: form.status,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const payload = buildPayload();

      if (!payload.title || !payload.type || !payload.applyScope) {
        setMessage("Vui lòng nhập đầy đủ thông tin bắt buộc");
        return;
      }

      if (!form.startDate || !form.endDate) {
        setMessage("Vui lòng chọn ngày bắt đầu và ngày kết thúc");
        return;
      }

      if (new Date(payload.startDate) > new Date(payload.endDate)) {
        setMessage("Ngày bắt đầu không được lớn hơn ngày kết thúc");
        return;
      }

      if (payload.type === "gift" && payload.giftItems.length === 0) {
        setMessage("Ưu đãi quà tặng phải có ít nhất 1 quà tặng");
        return;
      }

      if (
        (payload.type === "amount" || payload.type === "percent") &&
        Number(payload.value) < 0
      ) {
        setMessage("Giá trị giảm không hợp lệ");
        return;
      }

      if (payload.type === "percent" && Number(payload.value) > 100) {
        setMessage("Phần trăm giảm không được vượt quá 100");
        return;
      }

      if (payload.applyScope === "brand" && !payload.brand) {
        setMessage("Vui lòng nhập hãng xe");
        return;
      }

      if (payload.applyScope === "car" && payload.carIds.length === 0) {
        setMessage("Vui lòng nhập ít nhất 1 carId");
        return;
      }

      console.log("PROMOTION PAYLOAD:", payload);

      if (editingId) {
        await axios.put(
          `https://webbanxe-backend-stx9.onrender.com/api/promotions/${editingId}`,
          payload
        );
        setMessage("Cập nhật ưu đãi thành công");
      } else {
        await axios.post("https://webbanxe-backend-stx9.onrender.com/api/promotions", payload);
        setMessage("Tạo ưu đãi thành công");
      }

      resetForm();
      fetchPromotions();
    } catch (error) {
      console.log("SAVE PROMOTION ERROR:", error.response?.data || error);
      setMessage(error.response?.data?.message || "Lưu ưu đãi thất bại");
    }
  };

  const handleEdit = (promo) => {
    setEditingId(promo._id);
    setForm({
      title: promo.title || "",
      description: promo.description || "",
      type: promo.type || "amount",
      value: promo.value || 0,
      giftItems: Array.isArray(promo.giftItems)
        ? promo.giftItems.join(", ")
        : "",
      applyScope: promo.applyScope || "all",
      brand: promo.brand || "",
      carIds: Array.isArray(promo.carIds)
        ? promo.carIds
            .map((x) => (typeof x === "object" ? x._id : x))
            .join(", ")
        : "",
      startDate: promo.startDate ? promo.startDate.slice(0, 10) : "",
      endDate: promo.endDate ? promo.endDate.slice(0, 10) : "",
      status: promo.status || "active",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Xóa ưu đãi này?");
    if (!ok) return;

    try {
      await axios.delete(`https://webbanxe-backend-stx9.onrender.com/api/promotions/${id}`);
      setMessage("Xóa ưu đãi thành công");
      fetchPromotions();
      if (editingId === id) resetForm();
    } catch (error) {
      setMessage(error.response?.data?.message || "Xóa ưu đãi thất bại");
    }
  };

  return (
    <div className="admin-promotions-page">
      <div className="admin-promotions-container">
        <div className="admin-promotions-header">
          <div>
            <div className="admin-promotions-badge">
              Admin / Quản lý ưu đãi
            </div>
            <h1>Quản lý ưu đãi</h1>
            <p>Tạo, chỉnh sửa và quản lý chương trình giảm giá cho xe.</p>
          </div>
        </div>

        {message && <div className="admin-promotions-message">{message}</div>}

        <div
          className="admin-promotions-top-grid"
          style={{ gridTemplateColumns: isTablet ? "1fr" : "1.1fr 0.9fr" }}
        >
          <form onSubmit={handleSubmit} className="admin-promotions-card">
            <h2>{editingId ? "Chỉnh sửa ưu đãi" : "Tạo ưu đãi mới"}</h2>
            <p className="admin-promotions-sub">
              Điền đầy đủ thông tin để hiển thị đẹp ở trang chi tiết xe.
            </p>

            <div
              className="admin-promotions-form-grid"
              style={{
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(2, minmax(0, 1fr))",
              }}
            >
              <div className="admin-promotions-field full">
                <label>Tên ưu đãi</label>
                <input
                  name="title"
                  placeholder="Ví dụ: Ưu đãi tháng 3 / Quà tặng CX-5"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-promotions-field full">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  placeholder="Mô tả ngắn gọn, dễ đọc ở trang người dùng"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-promotions-field">
                <label>Loại ưu đãi</label>
                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="amount">Giảm tiền</option>
                  <option value="percent">Giảm phần trăm</option>
                  <option value="gift">Quà tặng</option>
                </select>
              </div>

              <div className="admin-promotions-field">
                <label>Phạm vi áp dụng</label>
                <select
                  name="applyScope"
                  value={form.applyScope}
                  onChange={handleChange}
                >
                  <option value="all">Toàn bộ xe</option>
                  <option value="brand">Theo hãng</option>
                  <option value="car">Theo xe</option>
                </select>
              </div>

              {form.type !== "gift" ? (
                <div className="admin-promotions-field">
                  <label>Giá trị giảm</label>
                  <input
                    name="value"
                    type="number"
                    placeholder="Nhập số tiền hoặc phần trăm"
                    value={form.value}
                    onChange={handleChange}
                  />
                </div>
              ) : (
                <div className="admin-promotions-field">
                  <label>Quà tặng</label>
                  <input
                    name="giftItems"
                    placeholder="Ngăn cách bằng dấu phẩy"
                    value={form.giftItems}
                    onChange={handleChange}
                  />
                </div>
              )}

              {form.applyScope === "brand" ? (
                <div className="admin-promotions-field">
                  <label>Hãng xe</label>
                  <input
                    name="brand"
                    placeholder="Ví dụ: mercedes-benz, porsche"
                    value={form.brand}
                    onChange={handleChange}
                  />
                </div>
              ) : form.applyScope === "car" ? (
                <div className="admin-promotions-field">
                  <label>Danh sách carId</label>
                  <input
                    name="carIds"
                    placeholder="Ngăn cách bằng dấu phẩy"
                    value={form.carIds}
                    onChange={handleChange}
                  />
                </div>
              ) : (
                <div className="admin-promotions-field">
                  <label>Giá trị hiển thị</label>
                  <input value="Áp dụng cho toàn bộ xe" disabled readOnly />
                </div>
              )}

              <div className="admin-promotions-field">
                <label>Ngày bắt đầu</label>
                <input
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-promotions-field">
                <label>Ngày kết thúc</label>
                <input
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-promotions-field full">
                <label>Trạng thái</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="active">Đang áp dụng</option>
                  <option value="inactive">Tắt</option>
                </select>
              </div>
            </div>

            <div className="admin-promotions-btn-row">
              <button type="submit" className="admin-promotions-primary-btn">
                {editingId ? "Cập nhật ưu đãi" : "Tạo ưu đãi"}
              </button>
              <button
                type="button"
                className="admin-promotions-secondary-btn"
                onClick={resetForm}
              >
                Làm mới
              </button>
            </div>
          </form>

          <div className="admin-promotions-card">
            <h2>Xem trước hiển thị</h2>
            <p className="admin-promotions-sub">
              Card này mô phỏng cách ưu đãi sẽ xuất hiện ở trang chi tiết xe.
            </p>

            <div className="admin-promotions-preview-card">
              <div className="admin-promotions-preview-badge">ƯU ĐÃI</div>
              <h3>{form.title || "Tên ưu đãi sẽ hiện ở đây"}</h3>
              <p>
                {form.description ||
                  "Mô tả ngắn sẽ hiển thị tại đây để người dùng dễ đọc hơn."}
              </p>

              <div className="admin-promotions-preview-highlight">
                {previewValue}
              </div>

              {form.type === "gift" && form.giftItems.trim() && (
                <div className="admin-promotions-preview-meta">
                  {form.giftItems
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean)
                    .map((item, index) => (
                      <div key={index}>• {item}</div>
                    ))}
                </div>
              )}

              <div className="admin-promotions-preview-meta">
                Phạm vi:{" "}
                {form.applyScope === "all"
                  ? "Toàn bộ xe"
                  : form.applyScope === "brand"
                  ? `Hãng ${form.brand || "..."}`
                  : "Theo xe cụ thể"}
                <br />
                Thời gian: {form.startDate || "..."} - {form.endDate || "..."}
                <br />
                Trạng thái: {form.status === "active" ? "Đang áp dụng" : "Tắt"}
              </div>
            </div>
          </div>
        </div>

        <h2 className="admin-promotions-list-title">
          Danh sách ưu đãi {loading ? "(đang tải...)" : `(${promotions.length})`}
        </h2>

        {!loading && promotions.length === 0 ? (
          <div className="admin-promotions-empty">Chưa có ưu đãi nào.</div>
        ) : (
          <div className="admin-promotions-list-grid">
            {promotions.map((promo) => (
              <div key={promo._id} className="admin-promotions-item-card">
                <div className="admin-promotions-item-top">
                  <h3>{promo.title}</h3>
                  <div
                    className={`admin-promotions-status ${
                      promo.status === "active" ? "active" : "inactive"
                    }`}
                  >
                    {promo.status === "active" ? "ACTIVE" : "INACTIVE"}
                  </div>
                </div>

                <div className="admin-promotions-item-desc">
                  {promo.description || "Không có mô tả."}
                </div>

                <div className="admin-promotions-info-grid">
                  <div className="admin-promotions-info-box">
                    <div className="label">Loại</div>
                    <div className="value">
                      {promo.type === "amount"
                        ? "Giảm tiền"
                        : promo.type === "percent"
                        ? "Giảm %"
                        : "Quà tặng"}
                    </div>
                  </div>

                  <div className="admin-promotions-info-box">
                    <div className="label">Phạm vi</div>
                    <div className="value">
                      {promo.applyScope === "all"
                        ? "Toàn bộ xe"
                        : promo.applyScope === "brand"
                        ? `Hãng ${promo.brand || ""}`
                        : "Theo xe"}
                    </div>
                  </div>

                  <div className="admin-promotions-info-box">
                    <div className="label">Giá trị</div>
                    <div className="value">
                      {promo.type === "amount"
                        ? `${Number(promo.value || 0).toLocaleString("vi-VN")}đ`
                        : promo.type === "percent"
                        ? `${promo.value || 0}%`
                        : Array.isArray(promo.giftItems) &&
                          promo.giftItems.length > 0
                        ? `${promo.giftItems.length} quà tặng`
                        : "Quà tặng"}
                    </div>
                  </div>

                  <div className="admin-promotions-info-box">
                    <div className="label">Thời gian</div>
                    <div className="value">
                      {new Date(promo.startDate).toLocaleDateString("vi-VN")} -{" "}
                      {new Date(promo.endDate).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </div>

                <div className="admin-promotions-action-row">
                  <button
                    type="button"
                    className="admin-promotions-edit-btn"
                    onClick={() => handleEdit(promo)}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="admin-promotions-delete-btn"
                    onClick={() => handleDelete(promo._id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}