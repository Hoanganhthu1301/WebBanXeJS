import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/admin/AdminCars.css";

const API_URL =
  import.meta.env.VITE_API_URL || "https://webbanxe-backend-stx9.onrender.com";

const createEmptyHighlight = () => ({
  title: "",
  text: "",
  image: "",
});

const createEmptyFeature = () => ({
  title: "",
  text: "",
  image: "",
});

const initialForm = {
  name: "",
  brand: "",
  category: "",
  price: "",
  quantity: 1,
  year: "",
  fuel: "",
  transmission: "",
  mileage: "",
  color: "",
  image: "",
  imagesText: "",
  model3dUrl: "",
  description: "",
  status: "available",
  overviewTitle: "",
  overviewText: "",
  highlights: [
    createEmptyHighlight(),
    createEmptyHighlight(),
    createEmptyHighlight(),
  ],
  features: [
    createEmptyFeature(),
    createEmptyFeature(),
    createEmptyFeature(),
    createEmptyFeature(),
  ],
};

export default function AdminCars() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [cars, setCars] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }

    fetchCars();
    fetchCategories();
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/brands`);
      setBrands(res.data.brands || []);
    } catch (error) {
      console.log("Không lấy được danh sách hãng", error);
    }
  };

  const fetchCars = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.get(`${API_URL}/api/cars/admin/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setCars(res.data.cars || []);
  } catch (error) {
    console.log("FETCH CARS ERROR:", error.response?.data || error);
    setMessage(error.response?.data?.message || "Không lấy được danh sách xe");
  }
};
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/categories`);
      setCategories(res.data.categories || []);
    } catch (error) {
      console.log("Không lấy được danh sách danh mục", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    setFormData({
      ...formData,
      [name]:
        type === "number"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    });
  };

  const handleNestedChange = (type, index, field, value) => {
    const updated = [...formData[type]];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setFormData({
      ...formData,
      [type]: updated,
    });
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const parseLinesToArray = (text) => {
    return text
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item !== "");
  };

  const normalizeArrayItems = (items) => {
    return items.filter(
      (item) =>
        (item.title && item.title.trim() !== "") ||
        (item.text && item.text.trim() !== "") ||
        (item.image && item.image.trim() !== "")
    );
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const token = localStorage.getItem("token");

    const parsedImages = parseLinesToArray(formData.imagesText);

    const payload = {
      name: formData.name,
      brand: formData.brand,
      category: formData.category,
      price: Number(formData.price),
      quantity:
        formData.quantity === "" ? 1 : Math.max(0, Number(formData.quantity)),
      year: Number(formData.year) || new Date().getFullYear(),
      fuel: formData.fuel,
      transmission: formData.transmission,
      mileage: Number(formData.mileage) || 0,
      color: formData.color,
      image: formData.image || parsedImages[0] || "",
      images: parsedImages,
      model3dUrl: formData.model3dUrl?.trim() || "",
      description: formData.description,
      status: formData.status,
      overviewTitle: formData.overviewTitle,
      overviewText: formData.overviewText,
      highlights: normalizeArrayItems(formData.highlights),
      features: normalizeArrayItems(formData.features),
    };

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    if (editingId) {
      await axios.put(`${API_URL}/api/cars/${editingId}`, payload, config);
      setMessage("Cập nhật xe thành công");
    } else {
      await axios.post(`${API_URL}/api/cars`, payload, config);
      setMessage("Thêm xe thành công");
    }

    resetForm();
    fetchCars();
  } catch (error) {
    console.log("UPDATE ERROR:", error.response?.data || error);
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
      quantity:
        car.quantity !== undefined && car.quantity !== null ? car.quantity : 1,
      year: car.year || "",
      fuel: car.fuel || "",
      transmission: car.transmission || "",
      mileage: car.mileage || "",
      color: car.color || "",
      image: car.image || "",
      imagesText: Array.isArray(car.images) ? car.images.join("\n") : "",
      model3dUrl: car.model3dUrl || "",
      description: car.description || "",
      status: car.status || "available",
      overviewTitle: car.overviewTitle || "",
      overviewText: car.overviewText || "",
      highlights:
        Array.isArray(car.highlights) && car.highlights.length > 0
          ? [
              car.highlights[0] || createEmptyHighlight(),
              car.highlights[1] || createEmptyHighlight(),
              car.highlights[2] || createEmptyHighlight(),
            ]
          : [
              createEmptyHighlight(),
              createEmptyHighlight(),
              createEmptyHighlight(),
            ],
      features:
        Array.isArray(car.features) && car.features.length > 0
          ? [
              car.features[0] || createEmptyFeature(),
              car.features[1] || createEmptyFeature(),
              car.features[2] || createEmptyFeature(),
              car.features[3] || createEmptyFeature(),
            ]
          : [
              createEmptyFeature(),
              createEmptyFeature(),
              createEmptyFeature(),
              createEmptyFeature(),
            ],
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
  const confirmDelete = window.confirm("Bạn có chắc muốn xóa xe này không?");
  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem("token");

    await axios.delete(`${API_URL}/api/cars/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setMessage("Xóa xe thành công");
    fetchCars();
  } catch (error) {
    setMessage(error.response?.data?.message || "Xóa xe thất bại");
  }
};
  const getThumb = (car) => {
    if (car.image && car.image.trim() !== "") return car.image;
    if (Array.isArray(car.images) && car.images.length > 0) return car.images[0];
    return "https://via.placeholder.com/100x70?text=No+Image";
  };

  const renderStatus = (car) => {
    if (car.status === "hidden") return "Ẩn";
    if ((car.quantity || 0) <= 0 || car.status === "sold") return "Hết hàng";
    if (car.status === "reserved") return "Đã giữ chỗ";
    return "Đang bán";
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

          <select name="brand" value={formData.brand} onChange={handleChange}>
            <option value="">-- Chọn hãng xe --</option>
            {brands
              .filter((item) => item.status === "active")
              .map((item) => (
                <option key={item._id} value={item.name}>
                  {item.name}
                </option>
              ))}
          </select>

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
            name="quantity"
            placeholder="Số lượng xe"
            min="0"
            value={formData.quantity}
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
            placeholder="Ảnh chính"
            value={formData.image}
            onChange={handleChange}
          />

          <input
            type="text"
            name="model3dUrl"
            placeholder="Đường dẫn model 3D, ví dụ: /models/porsche-panamera.glb"
            value={formData.model3dUrl}
            onChange={handleChange}
          />

          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="available">Đang bán</option>
            <option value="reserved">Đã giữ chỗ</option>
            <option value="hidden">Ẩn</option>
            <option value="sold">Hết hàng</option>
          </select>

          <textarea
            name="imagesText"
            placeholder="Nhiều link ảnh (mỗi dòng 1 link)"
            rows="5"
            value={formData.imagesText}
            onChange={handleChange}
          ></textarea>

          <textarea
            name="description"
            placeholder="Mô tả"
            rows="4"
            value={formData.description}
            onChange={handleChange}
          ></textarea>

          <input
            type="text"
            name="overviewTitle"
            placeholder="Tiêu đề giới thiệu"
            value={formData.overviewTitle}
            onChange={handleChange}
          />

          <textarea
            name="overviewText"
            placeholder="Nội dung giới thiệu"
            rows="4"
            value={formData.overviewText}
            onChange={handleChange}
          ></textarea>

          <div className="nested-block">
            <h3>Highlights / Điểm nổi bật</h3>
            {formData.highlights.map((item, index) => (
              <div className="nested-group" key={`highlight-${index}`}>
                <input
                  type="text"
                  placeholder={`Highlight ${index + 1} - Tiêu đề`}
                  value={item.title}
                  onChange={(e) =>
                    handleNestedChange("highlights", index, "title", e.target.value)
                  }
                />
                <textarea
                  rows="3"
                  placeholder={`Highlight ${index + 1} - Nội dung`}
                  value={item.text}
                  onChange={(e) =>
                    handleNestedChange("highlights", index, "text", e.target.value)
                  }
                ></textarea>
                <input
                  type="text"
                  placeholder={`Highlight ${index + 1} - Ảnh`}
                  value={item.image}
                  onChange={(e) =>
                    handleNestedChange("highlights", index, "image", e.target.value)
                  }
                />
              </div>
            ))}
          </div>

          <div className="nested-block">
            <h3>Features / Trang bị nổi bật</h3>
            {formData.features.map((item, index) => (
              <div className="nested-group" key={`feature-${index}`}>
                <input
                  type="text"
                  placeholder={`Feature ${index + 1} - Tiêu đề`}
                  value={item.title}
                  onChange={(e) =>
                    handleNestedChange("features", index, "title", e.target.value)
                  }
                />
                <textarea
                  rows="3"
                  placeholder={`Feature ${index + 1} - Nội dung`}
                  value={item.text}
                  onChange={(e) =>
                    handleNestedChange("features", index, "text", e.target.value)
                  }
                ></textarea>
                <input
                  type="text"
                  placeholder={`Feature ${index + 1} - Ảnh`}
                  value={item.image}
                  onChange={(e) =>
                    handleNestedChange("features", index, "image", e.target.value)
                  }
                />
              </div>
            ))}
          </div>

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
                <th>Số lượng</th>
                <th>Năm</th>
                <th>3D</th>
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
                        src={getThumb(car)}
                        alt={car.name}
                        className="car-thumb"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/100x70?text=No+Image";
                        }}
                      />
                    </td>
                    <td>{car.name}</td>
                    <td>{car.brand}</td>
                    <td>{car.category}</td>
                    <td>{Number(car.price).toLocaleString("vi-VN")}đ</td>
                    <td>{car.quantity ?? 1}</td>
                    <td>{car.year}</td>
                    <td>{car.model3dUrl ? "Có" : "Chưa có"}</td>
                    <td>{renderStatus(car)}</td>
                    <td>
                      <button className="edit-btn" onClick={() => handleEdit(car)}>
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
                  <td colSpan="10" style={{ textAlign: "center" }}>
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