import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/admin/AdminContacts.css";

export default function AdminContacts() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [contacts, setContacts] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }

    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/contacts");
      setContacts(res.data.contacts || []);
      setMessage("");
    } catch (error) {
      setMessage("Không lấy được danh sách yêu cầu tư vấn");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/contacts/${id}`, { status });
      fetchContacts();
    } catch (error) {
      setMessage("Cập nhật trạng thái thất bại");
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Bạn có chắc muốn xóa yêu cầu này không?");
    if (!ok) return;

    try {
      await axios.delete(`http://localhost:5000/api/contacts/${id}`);
      fetchContacts();
    } catch (error) {
      setMessage("Xóa yêu cầu thất bại");
    }
  };

  const getThumb = (contact) => {
    const car = contact.carId;
    if (!car) return "https://via.placeholder.com/100x70?text=No+Image";
    if (car.image && car.image.trim() !== "") return car.image;
    if (Array.isArray(car.images) && car.images.length > 0) return car.images[0];
    return "https://via.placeholder.com/100x70?text=No+Image";
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="admin-contacts-page">
      <div className="admin-contacts-header">
        <h1>Yêu cầu tư vấn</h1>
        <p>Danh sách khách hàng gửi yêu cầu tư vấn xe</p>
      </div>

      {message && <p className="message-text">{message}</p>}

      <div className="admin-contacts-box">
        <div className="contacts-table-wrapper">
          <table className="contacts-table">
            <thead>
              <tr>
                <th>Ảnh xe</th>
                <th>Khách hàng</th>
                <th>Liên hệ</th>
                <th>Xe quan tâm</th>
                <th>Thông tin xe</th>
                <th>Lý do / bổ sung</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length > 0 ? (
                contacts.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <img
                        src={getThumb(item)}
                        alt={item.carName}
                        className="contact-thumb"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/100x70?text=No+Image";
                        }}
                      />
                    </td>

                    <td>
                      <strong>
                        {[item.salutation, item.firstName, item.lastName]
                          .filter(Boolean)
                          .join(" ")}
                      </strong>
                      <br />
                      <span>{item.company || "—"}</span>
                      <br />
                      <span>
                        {[item.street, item.district, item.city, item.zipCode]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </span>
                    </td>

                    <td>
                      <div>
                        <strong>SĐT:</strong> {item.phone || "—"}
                      </div>
                      <div>
                        <strong>Email:</strong> {item.email || "—"}
                      </div>
                      <div>
                        <strong>Ưu tiên:</strong>{" "}
                        {item.preferredContact === "email" ? "Email" : "Gọi"}
                      </div>
                    </td>

                    <td>
                      <div>
                        <strong>{item.carName}</strong>
                      </div>
                      <div>{item.carId?.brand || "—"}</div>
                      <div>{item.carId?.category || "—"}</div>
                    </td>

                    <td>
                      <div>
                        <strong>Quốc gia:</strong> {item.country || "—"}
                      </div>
                      <div>
                        <strong>Ngân sách:</strong> {item.budget || "—"}
                      </div>
                      <div>
                        <strong>Mileage:</strong> {item.mileage || "—"}
                      </div>
                      <div>
                        <strong>Đời xe:</strong> {item.year || "—"}
                      </div>
                    </td>

                    <td>
                      <div>
                        <strong>Lý do:</strong> {item.reason || "—"}
                      </div>
                      <div>
                        <strong>Bổ sung:</strong> {item.additionalInfo || "—"}
                      </div>
                    </td>

                    <td>
                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleStatusChange(item._id, e.target.value)
                        }
                      >
                        <option value="new">Mới</option>
                        <option value="contacted">Đã liên hệ</option>
                      </select>
                    </td>

                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(item._id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    Chưa có yêu cầu nào
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