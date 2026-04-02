import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/admin/AdminUsers.css";
import { useTranslation } from 'react-i18next';

export default function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://webbanxe-backend-stx9.onrender.com/api/admin/users", {
        params: { q: keyword },
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users || []);
      setMessage("");
    } catch (error) {
      console.error("FETCH USERS ERROR:", error);
      setMessage(error?.response?.data?.message || "Không tải được danh sách người dùng");
      setUsers([]);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleBlock = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://webbanxe-backend-stx9.onrender.com/api/admin/users/${id}/toggle-block`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Không cập nhật được trạng thái");
    }
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <h1>{t('admin_users_title')}</h1>
        <p>{t('admin_users_desc')}</p>
      </div>

      <form className="admin-users-toolbar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder={t('admin_search_placeholder')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button type="submit">{t('btn_search')}</button>
      </form>

      {message && <div className="admin-users-message">{message}</div>}

      <div className="admin-users-table-wrap">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>{t('header_name')}</th>
              <th>{t('header_email')}</th>
              <th>{t('header_phone')}</th>
              <th>{t('header_status')}</th>
              <th>{t('header_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((u) => (
                <tr key={u._id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || t('phone_not_updated')}</td>
                  <td>
                    <span className={u.isBlocked ? "status blocked" : "status active"}>
                      {u.isBlocked ? t('status_blocked') : t('status_active')}
                    </span>
                  </td>
                  <td>
                    <div className="action-group">
                      <button type="button" className="btn-action" onClick={() => handleToggleBlock(u._id)}>
                        {u.isBlocked ? t('btn_unblock') : t('btn_block')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-row">Không có dữ liệu</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}