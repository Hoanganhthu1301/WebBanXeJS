import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/admin/AdminBrands.css";

const initialForm = {
  name: "",
  status: "active",
};

export default function AdminBrands() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [brands, setBrands] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await axios.get("https://webbanxe-backend-stx9.onrender.com/api/brands");
      setBrands(res.data.brands || []);
    } catch {
      setMessage("Không lấy được danh sách hãng");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await axios.put(`https://webbanxe-backend-stx9.onrender.com/api/brands/${editingId}`, formData);
        setMessage("Cập nhật hãng thành công");
      } else {
        await axios.post("https://webbanxe-backend-stx9.onrender.com/api/brands", formData);
        setMessage("Thêm hãng thành công");
      }

      resetForm();
      fetchBrands();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Có lỗi xảy ra"
      );
    }
  };

  const handleEdit = (brand) => {
    setEditingId(brand._id);
    setFormData({
      name: brand.name || "",
      status: brand.status || "active",
    });
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Bạn có chắc muốn xóa hãng này không?");
    if (!ok) return;

    try {
      await axios.delete(`https://webbanxe-backend-stx9.onrender.com/api/brands/${id}`);
      setMessage("Xóa hãng thành công");
      fetchBrands();
    } catch (error) {
      setMessage(error.response?.data?.message || "Xóa hãng thất bại");
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="admin-brands-page">
      <div className="admin-brands-header">
        <h1>Quản lý hãng xe</h1>
        <p>Thêm, sửa, xóa hãng xe</p>
      </div>

      <div className="admin-brands-box">
        <h2>{editingId ? "Cập nhật hãng" : "Thêm hãng mới"}</h2>

        <form className="brand-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Tên hãng"
            value={formData.name}
            onChange={handleChange}
          />

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="active">Hiển thị</option>
            <option value="hidden">Ẩn</option>
          </select>

          <div className="form-actions">
            <button type="submit" className="save-btn">
              {editingId ? "Cập nhật" : "Thêm hãng"}
            </button>

            <button type="button" className="cancel-btn" onClick={resetForm}>
              Làm mới
            </button>
          </div>
        </form>

        {message && <p className="message-text">{message}</p>}
      </div>

      <div className="admin-brands-box">
        <h2>Danh sách hãng xe</h2>

        <table className="brands-table">
          <thead>
            <tr>
              <th>Tên hãng</th>
              <th>Slug</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {brands.length > 0 ? (
              brands.map((brand) => (
                <tr key={brand._id}>
                  <td>{brand.name}</td>
                  <td>{brand.slug}</td>
                  <td>{brand.status === "active" ? "Hiển thị" : "Ẩn"}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(brand)}
                    >
                      Sửa
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(brand._id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  Chưa có hãng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}