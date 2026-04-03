import { useEffect, useState } from "react";
import axios from "axios";
import MainNavbar from "../../components/MainNavbar";
import "../../styles/user/UserProfile.css";
import bgVideo from "../../assets/profile-bg.mp4";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const token = localStorage.getItem("token");

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = res.data.user;
      setUser(userData);
      setForm({
        fullName: userData.fullName || "",
        phone: userData.phone || "",
        address: userData.address || "",
      });
      setAvatarPreview(userData.avatar ? `${API_URL}${userData.avatar}` : "");
    } catch (error) {
      console.error("Lỗi lấy profile:", error);
      alert(error.response?.data?.message || "Không thể lấy thông tin cá nhân");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("phone", form.phone);
      formData.append("address", form.address);

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await axios.put(`${API_URL}/api/auth/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedUser = res.data.user;
      setUser(updatedUser);

      const oldUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...oldUser,
          ...updatedUser,
        })
      );

      if (updatedUser.avatar) {
        setAvatarPreview(`${API_URL}${updatedUser.avatar}`);
      }

      alert("Cập nhật hồ sơ thành công");
    } catch (error) {
      console.error("Lỗi cập nhật profile:", error);
      alert(error.response?.data?.message || "Cập nhật hồ sơ thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.put(
        `${API_URL}/api/auth/change-password`,
        passwordForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(res.data.message || "Đổi mật khẩu thành công");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
      });
    } catch (error) {
      console.error("Lỗi đổi mật khẩu:", error);
      alert(error.response?.data?.message || "Đổi mật khẩu thất bại");
    }
  };

  const renderVideoBg = () => (
    <div className="profile-video-bg">
      <video
        autoPlay
        muted
        loop
        playsInline
        onLoadedData={() => console.log("VIDEO PROFILE LOAD OK")}
        onError={() => console.log("VIDEO PROFILE LOAD FAIL")}
      >
        <source src={bgVideo} type="video/mp4" />
      </video>
      <div className="profile-video-overlay" />
    </div>
  );

  if (loading) {
    return (
      <>
        <MainNavbar />
        <div className="user-profile-page">
          {renderVideoBg()}
          <div className="user-profile-container">
            <p className="user-profile-loading">Đang tải thông tin cá nhân...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MainNavbar />
      <div className="user-profile-page">
        {renderVideoBg()}

        <div className="user-profile-container">
          <div className="user-profile-header">
            <p className="user-profile-subtitle">TÀI KHOẢN CỦA BẠN</p>
            <h1>Hồ sơ cá nhân</h1>
            <p className="user-profile-desc">
              Cập nhật hồ sơ, ảnh đại diện và quản lý bảo mật tài khoản trong không gian cá nhân cao cấp của bạn.
            </p>
          </div>

          <div className="user-profile-grid">
            <div className="user-profile-card">
              <h2>Thông tin cá nhân</h2>

              <form onSubmit={handleUpdateProfile} className="user-profile-form">
                <div className="avatar-upload-box">
                  <div className="avatar-preview">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" />
                    ) : (
                      <div className="avatar-placeholder">
                        {form.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>

                  <label className="avatar-upload-btn">
                    Chọn ảnh
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      hidden
                    />
                  </label>
                </div>

                <div className="form-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={user?.email || ""} disabled />
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div className="form-group">
                  <label>Địa chỉ</label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ của bạn"
                    rows="4"
                  />
                </div>

                <button
                  type="submit"
                  className="profile-save-btn"
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </form>
            </div>

            <div className="user-profile-card">
              <h2>Trung tâm bảo mật</h2>

              {user?.provider === "google" ? (
                <div className="profile-security-note">
                  Tài khoản này đang đăng nhập bằng Google, nên không dùng đổi mật khẩu cục bộ.
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="user-profile-form">
                  <div className="form-group">
                    <label>Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                  </div>

                  <div className="form-group">
                    <label>Mật khẩu mới</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Nhập mật khẩu mới"
                    />
                  </div>

                  <button type="submit" className="profile-save-btn">
                    Đổi mật khẩu
                  </button>
                </form>
              )}

              <div className="profile-meta-box">
                <p><strong>Vai trò:</strong> {user?.role || "user"}</p>
                <p><strong>Đăng nhập bằng:</strong> {user?.provider || "local"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}