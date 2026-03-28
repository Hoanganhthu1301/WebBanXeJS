import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/admin/AdminUsers.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:5000/api/admin/users", {
        params: { q: keyword },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(res.data.users || []);
      setMessage("");
    } catch (error) {
      console.error("FETCH USERS ERROR:", error);
      setMessage(
        error?.response?.data?.message || "Không tải được danh sách người dùng"
      );
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleBlock = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/admin/users/${id}/toggle-block`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchUsers();
    } catch (error) {
      console.error(error);
      setMessage(error?.response?.data?.message || "Không cập nhật được trạng thái");
    }
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <h1>Quản lý người dùng</h1>
        <p>Quản lý tài khoản khách hàng. Không xóa tài khoản, chỉ khóa hoặc mở khóa.</p>
      </div>

      <form className="admin-users-toolbar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Tìm theo tên, email, số điện thoại"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button type="submit">Tìm</button>
      </form>

      {message && <div className="admin-users-message">{message}</div>}

      <div className="admin-users-table-wrap">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Email</th>
              <th>SĐT</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((u) => (
                <tr key={u._id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || "Chưa cập nhật"}</td>
                  <td>
                    <span className={u.isBlocked ? "status blocked" : "status active"}>
                      {u.isBlocked ? "Đã khóa" : "Hoạt động"}
                    </span>
                  </td>
                  <td>
                    <div className="action-group">
                      <button
                        type="button"
                        className="btn-action"
                        onClick={() => handleToggleBlock(u._id)}
                      >
                        {u.isBlocked ? "Mở khóa" : "Khóa tài khoản"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-row">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}