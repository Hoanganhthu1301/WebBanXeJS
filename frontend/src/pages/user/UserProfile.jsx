import { useEffect, useState } from "react";
import axios from "axios";
import MainNavbar from "../../components/MainNavbar";
import "../../styles/user/UserProfile.css";
import bgVideo from "../../assets/profile-bg.mp4";
import { useTranslation } from "react-i18next";
import PageLoader from "../../components/PageLoader";

const API_URL =
  import.meta.env.VITE_API_URL || "https://webbanxe-backend-stx9.onrender.com";

export default function UserProfile() {
  const { t } = useTranslation();

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
      alert(error.response?.data?.message || t("profile_fetch_fail"));
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

      alert(t("profile_update_success"));
    } catch (error) {
      console.error("Lỗi cập nhật profile:", error);
      alert(error.response?.data?.message || t("profile_update_fail"));
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

      alert(res.data.message || t("profile_password_success"));

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
      });
    } catch (error) {
      console.error("Lỗi đổi mật khẩu:", error);
      alert(error.response?.data?.message || t("profile_password_fail"));
    }
  };

  const renderVideoBg = () => (
    <div className="profile-video-bg">
      <video autoPlay muted loop playsInline>
        <source src={bgVideo} type="video/mp4" />
      </video>
      <div className="profile-video-overlay" />
    </div>
  );

  const userInitial = form.fullName?.charAt(0)?.toUpperCase() || "U";

  if (loading) return <PageLoader />;

  return (
    <>
      <MainNavbar />
      <div className="user-profile-page">
        {renderVideoBg()}

        <section className="user-profile-hero">
          <div className="user-profile-shell">
            <div className="user-profile-header">
              <p className="user-profile-subtitle">{t("profile_subtitle")}</p>
              <h1>{t("profile_title")}</h1>
              <p className="user-profile-desc">{t("profile_desc")}</p>
            </div>

            <div className="user-profile-topbar">
              <div className="user-profile-identity">
                <div className="user-profile-avatar-large">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>

                <div className="user-profile-identity-text">
                  <h2>{form.fullName || t("user_default")}</h2>
                  <p>{user?.email || t("not_available")}</p>
                  <div className="user-profile-badges">
                    <span>{user?.role || "user"}</span>
                    <span>{user?.provider || "local"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="user-profile-grid">
              <div className="user-profile-card">
                <div className="user-profile-card-head">
                  <p>{t("profile_info_badge")}</p>
                  <h3>{t("profile_personal_info")}</h3>
                </div>

                <form onSubmit={handleUpdateProfile} className="user-profile-form">
                  <div className="avatar-upload-box">
                    <div className="avatar-preview">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" />
                      ) : (
                        <div className="avatar-placeholder">{userInitial}</div>
                      )}
                    </div>

                    <div className="avatar-upload-content">
                      <h4>{t("profile_avatar_title")}</h4>
                      <p>{t("profile_avatar_desc")}</p>
                      <label className="profile-outline-btn">
                        {t("profile_choose_image")}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          hidden
                        />
                      </label>
                    </div>
                  </div>

                  <div className="user-profile-form-grid">
                    <div className="form-group">
                      <label>{t("profile_full_name")}</label>
                      <input
                        type="text"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder={t("profile_ph_full_name")}
                      />
                    </div>

                    <div className="form-group">
                      <label>{t("label_email")}</label>
                      <input type="email" value={user?.email || ""} disabled />
                    </div>

                    <div className="form-group">
                      <label>{t("profile_phone")}</label>
                      <input
                        type="text"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder={t("profile_ph_phone")}
                      />
                    </div>

                    <div className="form-group">
                      <label>{t("profile_login_provider")}</label>
                      <input value={user?.provider || "local"} disabled />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t("profile_address")}</label>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder={t("profile_ph_address")}
                      rows="4"
                    />
                  </div>

                  <button
                    type="submit"
                    className="profile-primary-btn"
                    disabled={saving}
                  >
                    {saving ? t("profile_saving") : t("profile_save_changes")}
                  </button>
                </form>
              </div>

              <div className="user-profile-card">
                <div className="user-profile-card-head">
                  <p>{t("profile_security_badge")}</p>
                  <h3>{t("profile_security_center")}</h3>
                </div>

                {user?.provider === "google" ? (
                  <div className="profile-security-note">
                    {t("profile_google_note")}
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="user-profile-form">
                    <div className="form-group">
                      <label>{t("profile_current_password")}</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder={t("profile_ph_current_password")}
                      />
                    </div>

                    <div className="form-group">
                      <label>{t("profile_new_password")}</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        placeholder={t("profile_ph_new_password")}
                      />
                    </div>

                    <button type="submit" className="profile-primary-btn">
                      {t("profile_change_password")}
                    </button>
                  </form>
                )}

                <div className="profile-meta-box">
                  <div className="profile-meta-item">
                    <span>{t("profile_role")}</span>
                    <strong>{user?.role || "user"}</strong>
                  </div>
                  <div className="profile-meta-item">
                    <span>{t("profile_login_provider")}</span>
                    <strong>{user?.provider || "local"}</strong>
                  </div>
                  <div className="profile-meta-item">
                    <span>{t("label_email")}</span>
                    <strong>{user?.email || t("not_available")}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}