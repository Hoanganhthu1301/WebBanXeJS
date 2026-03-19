import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/admin/AdminCars.css";

const initialForm = {
  name: "",
  brand: "",
  category: "",
  price: "",
  year: "",
  fuel: "",
  transmission: "",
  mileage: "",
  color: "",
  image: "",
  description: "",
  status: "available",
};

export default function AdminCars() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [cars, setCars] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }

    fetchCars();
    fetchCategories();
  }, []);

  const fetchCars = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/cars");
      setCars(res.data.cars || []);
    } catch (error) {
      setMessage("Không lấy được danh sách xe");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/categories");
      setCategories(res.data.categories || []);
    } catch (error) {
      console.log("Không lấy được danh sách danh mục", error);
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
      const payload = {
        ...formData,
        price: Number(formData.price),
        year: Number(formData.year) || new Date().getFullYear(),
        mileage: Number(formData.mileage) || 0,
      };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/cars/${editingId}`, payload);
        setMessage("Cập nhật xe thành công");
      } else {
        await axios.post("http://localhost:5000/api/cars", payload);
        setMessage("Thêm xe thành công");
      }

      resetForm();
      fetchCars();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Có lỗi xảy ra"
      );
    }
  };

  const handleEdit = (car) => {
    setEditingId(car._id);
    setFormData({
      name: car.name || "",
      brand: car.brand || "",
      category: car.category || "",
      price: car.price || "",
      year: car.year || "",
      fuel: car.fuel || "",
      transmission: car.transmission || "",
      mileage: car.mileage || "",
      color: car.color || "",
      image: car.image || "",
      description: car.description || "",
      status: car.status || "available",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa xe này không?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/cars/${id}`);
      setMessage("Xóa xe thành công");
      fetchCars();
    } catch (error) {
      setMessage(error.response?.data?.message || "Xóa xe thất bại");
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="admin-cars-page">
      <div className="admin-cars-header">
        <h1>Quản lý xe</h1>
        <p>Thêm, sửa, xóa xe trong hệ thống</p>
      </div>

      <div className="admin-cars-box">
        <h2>{editingId ? "Cập nhật xe" : "Thêm xe mới"}</h2>

        <form className="car-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Tên xe"
            value={formData.name}
            onChange={handleChange}
          />

          <input
            type="text"
            name="brand"
            placeholder="Hãng xe"
            value={formData.brand}
            onChange={handleChange}
          />

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">-- Chọn danh mục xe --</option>
            {categories
              .filter((item) => item.status === "active")
              .map((item) => (
                <option key={item._id} value={item.name}>
                  {item.name}
                </option>
              ))}
          </select>

          <input
            type="number"
            name="price"
            placeholder="Giá"
            value={formData.price}
            onChange={handleChange}
          />

          <input
            type="number"
            name="year"
            placeholder="Năm sản xuất"
            value={formData.year}
            onChange={handleChange}
          />

          <input
            type="text"
            name="fuel"
            placeholder="Nhiên liệu"
            value={formData.fuel}
            onChange={handleChange}
          />

          <input
            type="text"
            name="transmission"
            placeholder="Hộp số"
            value={formData.transmission}
            onChange={handleChange}
          />

          <input
            type="number"
            name="mileage"
            placeholder="Số km đã đi"
            value={formData.mileage}
            onChange={handleChange}
          />

          <input
            type="text"
            name="color"
            placeholder="Màu xe"
            value={formData.color}
            onChange={handleChange}
          />

          <input
            type="text"
            name="image"
            placeholder="Link ảnh"
            value={formData.image}
            onChange={handleChange}
          />

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="available">Đang bán</option>
            <option value="hidden">Ẩn</option>
          </select>

          <textarea
            name="description"
            placeholder="Mô tả"
            rows="4"
            value={formData.description}
            onChange={handleChange}
          ></textarea>

          <div className="form-actions">
            <button type="submit" className="save-btn">
              {editingId ? "Cập nhật xe" : "Thêm xe"}
            </button>

            <button type="button" className="cancel-btn" onClick={resetForm}>
              Làm mới
            </button>
          </div>
        </form>

        {message && <p className="message-text">{message}</p>}
      </div>

      <div className="admin-cars-box">
        <h2>Danh sách xe</h2>

        <div className="cars-table-wrapper">
          <table className="cars-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên xe</th>
                <th>Hãng</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Năm</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {cars.length > 0 ? (
                cars.map((car) => (
                  <tr key={car._id}>
                    <td>
                      <img
                        src={
                          car.image ||
                          "https://via.placeholder.com/100x70?text=No+Image"
                        }
                        alt={car.name}
                        className="car-thumb"
                      />
                    </td>
                    <td>{car.name}</td>
                    <td>{car.brand}</td>
                    <td>{car.category}</td>
                    <td>{Number(car.price).toLocaleString("vi-VN")}đ</td>
                    <td>{car.year}</td>
                    <td>{car.status === "available" ? "Đang bán" : "Ẩn"}</td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(car)}
                      >
                        Sửa
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(car._id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    Chưa có xe nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}