import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/admin/AdminShowrooms.css";

const initialForm = {
  name: "",
  address: "",
  phone: "",
  openHours: "",
  latitude: "",
  longitude: "",
  supportedBrands: "",
  status: "active",
  note: "",
};

export default function AdminShowrooms() {
  const [showrooms, setShowrooms] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const reloadShowrooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "https://webbanxe-backend-stx9.onrender.com/api/showrooms/admin/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setShowrooms(res.data.showrooms || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách showroom:", error);
      setMessage("Không lấy được danh sách showroom");
    }
  };

  useEffect(() => {
    const loadShowrooms = async () => {
      await reloadShowrooms();
    };

    loadShowrooms();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        supportedBrands: form.supportedBrands
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (editingId) {
        await axios.put(
          `https://webbanxe-backend-stx9.onrender.com/api/showrooms/${editingId}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.post("https://webbanxe-backend-stx9.onrender.com/api/showrooms", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      const isUpdating = Boolean(editingId);

      resetForm();
      await reloadShowrooms();
      setMessage(
        isUpdating
          ? "Cập nhật showroom thành công"
          : "Thêm showroom thành công"
      );
    } catch (error) {
      console.error("Lỗi lưu showroom:", error);
      setMessage(error?.response?.data?.message || "Lưu showroom thất bại");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name || "",
      address: item.address || "",
      phone: item.phone || "",
      openHours: item.openHours || "",
      latitude: item.latitude ?? "",
      longitude: item.longitude ?? "",
      supportedBrands: Array.isArray(item.supportedBrands)
        ? item.supportedBrands.join(", ")
        : "",
      status: item.status || "active",
      note: item.note || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa showroom này?");
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(`https://webbanxe-backend-stx9.onrender.com/api/showrooms/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await reloadShowrooms();
      setMessage("Xóa showroom thành công");
    } catch (error) {
      console.error("Lỗi xóa showroom:", error);
      setMessage(error?.response?.data?.message || "Xóa showroom thất bại");
    }
  };

  return (
    <div className="admin-showrooms-page">
      <div className="admin-showrooms-header">
        <h1>Quản lý showroom</h1>
        <p>Thêm, chỉnh sửa và quản lý vị trí showroom trên bản đồ.</p>
      </div>

      {message && <div className="admin-showrooms-message">{message}</div>}

      <div className="admin-showrooms-layout">
        <form className="admin-showrooms-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Chỉnh sửa showroom" : "Thêm showroom mới"}</h2>

          <input
            name="name"
            placeholder="Tên showroom"
            value={form.name}
            onChange={handleChange}
          />
          <input
            name="address"
            placeholder="Địa chỉ"
            value={form.address}
            onChange={handleChange}
          />
          <input
            name="phone"
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={handleChange}
          />
          <input
            name="openHours"
            placeholder="Giờ mở cửa"
            value={form.openHours}
            onChange={handleChange}
          />
          <input
            name="latitude"
            placeholder="Latitude"
            value={form.latitude}
            onChange={handleChange}
          />
          <input
            name="longitude"
            placeholder="Longitude"
            value={form.longitude}
            onChange={handleChange}
          />
          <input
            name="supportedBrands"
            placeholder="Hãng hỗ trợ, cách nhau bằng dấu phẩy"
            value={form.supportedBrands}
            onChange={handleChange}
          />

          <select name="status" value={form.status} onChange={handleChange}>
            <option value="active">Hiển thị</option>
            <option value="hidden">Ẩn</option>
          </select>

          <textarea
            name="note"
            rows="4"
            placeholder="Ghi chú"
            value={form.note}
            onChange={handleChange}
          />

          <div className="admin-showrooms-form-actions">
            <button type="submit">
              {editingId ? "Cập nhật" : "Thêm showroom"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary"
                onClick={resetForm}
              >
                Hủy sửa
              </button>
            )}
          </div>
        </form>

        <div className="admin-showrooms-list">
          <h2>Danh sách showroom</h2>

          {showrooms.length === 0 ? (
            <p className="empty">Chưa có showroom nào.</p>
          ) : (
            <div className="admin-showrooms-cards">
              {showrooms.map((item) => (
                <div className="admin-showroom-card" key={item._id}>
                  <div className="admin-showroom-card__top">
                    <h3>{item.name}</h3>
                    <span>{item.status}</span>
                  </div>

                  <p>{item.address}</p>
                  <p>SĐT: {item.phone || "—"}</p>
                  <p>Giờ mở cửa: {item.openHours || "—"}</p>
                  <p>Lat: {item.latitude}</p>
                  <p>Lng: {item.longitude}</p>
                  <p>
                    Hãng:{" "}
                    {Array.isArray(item.supportedBrands) &&
                    item.supportedBrands.length
                      ? item.supportedBrands.join(", ")
                      : "—"}
                  </p>

                  <div className="admin-showroom-card__actions">
                    <button type="button" onClick={() => handleEdit(item)}>
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleDelete(item._id)}
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
    </div>
  );
}