import { useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../socket";
import "./NotificationBell.css";
import { useTranslation } from 'react-i18next';

export default function NotificationBell({ dark = true }) {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const token = localStorage.getItem("token");

  const { t } = useTranslation();

  const authHeaders = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  const fetchNotifications = async () => {
    try {
      if (!token) return;

      const res = await axios.get(
        "https://webbanxe-backend-stx9.onrender.com/api/notifications",
        authHeaders
      );

      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.log("fetchNotifications error:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleNewNotification = ({ notification }) => {
      if (!notification) return;

      setNotifications((prev) => [notification, ...prev].slice(0, 30));
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString("vi-VN");
  };

  const handleOpen = () => {
    setOpen((prev) => !prev);
  };

  const handleClickNotification = async (item) => {
    try {
      if (!item.isRead) {
        await axios.put(
          `https://webbanxe-backend-stx9.onrender.com/api/notifications/${item._id}/read`,
          {},
          authHeaders
        );
      }

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === item._id ? { ...n, isRead: true } : n
        )
      );

      setUnreadCount((prev) => (item.isRead ? prev : Math.max(prev - 1, 0)));

      if (item.link) {
        navigate(item.link);
      }

      setOpen(false);
    } catch (error) {
      console.log("click notification error:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(
        "https://webbanxe-backend-stx9.onrender.com/api/notifications/read-all",
        {},
        authHeaders
      );

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.log("mark all read error:", error);
    }
  };

  return (
    <div
      className={`notification-bell ${dark ? "theme-dark" : "theme-light"}`}
      ref={wrapperRef}
    >
      <button
        type="button"
        className="notification-bell-btn"
        onClick={handleOpen}
        title={t('Thông báo')}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-bell-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header notification-header-row">
            <strong>{t('notification_title')}</strong>

            {notifications.length > 0 && unreadCount > 0 && (
              <button
                type="button"
                className="notification-read-all-btn"
                onClick={handleMarkAllAsRead}
              >
                {t('notification_read_all')}
              </button>
            )}
          </div>

          <div className="notification-dropdown-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">{t('notification_empty')}</div>
            ) : (
              notifications.map((item) => (
                <button
                  type="button"
                  key={item._id}
                  className={`notification-item ${
                    item.isRead ? "read" : "unread"
                  }`}
                  onClick={() => handleClickNotification(item)}
                >
                  <div className="notification-item-title">
                    {item.title || t('notification_default_title')}
                  </div>
                  <div className="notification-item-message">
                    {item.message}
                  </div>
                  <div className="notification-item-time">
                    {formatTime(item.createdAt)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}