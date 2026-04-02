import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/admin/AdminCategories.css";

const initialForm = {
  name: "",
  status: "active",
};

export default function AdminCategories() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("https://webbanxe-backend-stx9.onrender.com/api/categories");
      setCategories(res.data.categories || []);
    } catch {
      setMessage("Không lấy được danh sách danh mục");
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
        await axios.put(
          `https://webbanxe-backend-stx9.onrender.com/api/categories/${editingId}`,
          formData
        );
        setMessage("Cập nhật danh mục thành công");
      } else {
        await axios.post("https://webbanxe-backend-stx9.onrender.com/api/categories", formData);
        setMessage("Thêm danh mục thành công");
      }

      resetForm();
      fetchCategories();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Có lỗi xảy ra"
      );
    }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setFormData({
      name: category.name || "",
      status: category.status || "active",
    });
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Bạn có chắc muốn xóa danh mục này không?");
    if (!ok) return;

    try {
      await axios.delete(`https://webbanxe-backend-stx9.onrender.com/api/categories/${id}`);
      setMessage("Xóa danh mục thành công");
      fetchCategories();
    } catch (error) {
      setMessage(error.response?.data?.message || "Xóa danh mục thất bại");
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="admin-categories-page">
      <div className="admin-categories-header">
        <h1>Quản lý danh mục</h1>
        <p>Thêm, sửa, xóa danh mục xe</p>
      </div>

      <div className="admin-categories-box">
        <h2>{editingId ? "Cập nhật danh mục" : "Thêm danh mục mới"}</h2>

        <form className="category-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Tên danh mục"
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
              {editingId ? "Cập nhật" : "Thêm danh mục"}
            </button>

            <button type="button" className="cancel-btn" onClick={resetForm}>
              Làm mới
            </button>
          </div>
        </form>

        {message && <p className="message-text">{message}</p>}
      </div>

      <div className="admin-categories-box">
        <h2>Danh sách danh mục</h2>

        <table className="categories-table">
          <thead>
            <tr>
              <th>Tên danh mục</th>
              <th>Slug</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? (
              categories.map((category) => (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td>{category.status === "active" ? "Hiển thị" : "Ẩn"}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(category)}
                    >
                      Sửa
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(category._id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  Chưa có danh mục nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}