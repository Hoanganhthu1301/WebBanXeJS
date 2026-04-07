import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MainNavbar from "../../components/MainNavbar";
import ShowroomMap from "../../components/ShowroomMap";
import "../../styles/user/ShowroomsPage.css";
import PageLoader from "../../components/PageLoader";
import { useTranslation } from "react-i18next";

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function ShowroomsPage() {
  const { t } = useTranslation();

  const [showrooms, setShowrooms] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShowrooms();
  }, []);

  const fetchShowrooms = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "https://webbanxe-backend-stx9.onrender.com/api/showrooms"
      );
      setShowrooms(res.data.showrooms || []);
      setMessage("");
    } catch (error) {
      console.error("Lỗi lấy showroom:", error);
      setMessage(t("showrooms_fetch_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setMessage(t("showrooms_geolocation_not_supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setMessage("");
      },
      () => {
        setMessage(t("showrooms_location_error"));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const nearestShowroom = useMemo(() => {
    if (!userLocation || !showrooms.length) return null;

    const [lat, lng] = userLocation;

    return [...showrooms]
      .map((item) => ({
        ...item,
        distanceKm: getDistanceKm(lat, lng, item.latitude, item.longitude),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];
  }, [userLocation, showrooms]);

  if (loading) return <PageLoader />;

  return (
    <div className="showrooms-page">
      <MainNavbar />

      <section className="showrooms-hero">
        <div className="showrooms-hero__overlay" />
        <div className="showrooms-hero__content">
          <p className="showrooms-eyebrow">{t("showroom_network")}</p>
          <h1>{t("showroom_system_title")}</h1>
          <p>{t("showroom_system_desc")}</p>

          <div className="showrooms-hero__actions">
            <button
              className="showrooms-primary-btn"
              onClick={handleDetectLocation}
            >
              {t("btn_find_nearest_showroom")}
            </button>
          </div>
        </div>
      </section>

      <section className="showrooms-section">
        <div className="showrooms-container">
          {message && <div className="showrooms-message">{message}</div>}

          {nearestShowroom && (
            <div className="showrooms-nearest-card">
              <p className="showrooms-nearest-label">
                {t("showrooms_nearest_label")}
              </p>
              <h3>{nearestShowroom.name}</h3>
              <p>{nearestShowroom.address}</p>
              <span>{nearestShowroom.distanceKm.toFixed(1)} km</span>
            </div>
          )}

          <div className="showrooms-grid">
            <div className="showrooms-map-card">
              <ShowroomMap showrooms={showrooms} userLocation={userLocation} />
            </div>

            <div className="showrooms-list-card">
              <div className="showrooms-list-header">
                <h2>{t("showroom_list_title")}</h2>
                <span>
                  {showrooms.length} {t("showroom_branch_count")}
                </span>
              </div>

              {showrooms.length === 0 ? (
                <p className="showrooms-empty">{t("showrooms_empty")}</p>
              ) : (
                <div className="showrooms-list">
                  {showrooms.map((item) => (
                    <div className="showrooms-item" key={item._id}>
                      <h3>{item.name}</h3>
                      <p>{item.address}</p>
                      <p>
                        {t("showroom_phone")}: {item.phone || t("dash")}
                      </p>
                      <p>
                        {t("showroom_open_hours")}:{" "}
                        {item.openHours || t("dash")}
                      </p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("btn_get_directions")}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}