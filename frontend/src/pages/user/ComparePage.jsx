import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MainNavbar from "../../components/MainNavbar";
import PageLoader from "../../components/PageLoader";
import { useTranslation } from "react-i18next";
import {
  getCompareCars,
  removeFromCompare,
  clearCompareCars,
} from "../../utils/compare";

export default function ComparePage() {
  const { t, i18n } = useTranslation();

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCompareCars();
  }, []);

  const fetchCompareCars = async () => {
    try {
      setLoading(true);
      setMessage("");

      const ids = getCompareCars();

      if (!ids.length) {
        setCars([]);
        setMessage(t("compare_empty"));
        return;
      }

      const responses = await Promise.all(
        ids.map((id) =>
          axios.get(`https://webbanxe-backend-stx9.onrender.com/api/cars/${id}`)
        )
      );

      const carList = responses.map((res) => res.data.car).filter(Boolean);
      setCars(carList);
    } catch (error) {
      console.log("Lỗi compare:", error);
      setMessage(t("compare_fetch_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (carId) => {
    removeFromCompare(carId);
    fetchCompareCars();
  };

  const handleClearAll = () => {
    clearCompareCars();
    setCars([]);
    setMessage(t("compare_clear_success"));
  };

  const comparisonRows = useMemo(
    () => [
      { label: t("compare_row_image"), key: "image", type: "image" },
      { label: t("compare_row_name"), key: "name" },
      { label: t("compare_row_brand"), key: "brand" },
      { label: t("compare_row_category"), key: "category" },
      { label: t("compare_row_price"), key: "price", type: "price" },
      { label: t("compare_row_year"), key: "year" },
      { label: t("compare_row_fuel"), key: "fuel" },
      { label: t("compare_row_transmission"), key: "transmission" },
      { label: t("compare_row_mileage"), key: "mileage" },
      { label: t("compare_row_color"), key: "color" },
      { label: t("compare_row_status"), key: "status" },
      { label: t("compare_row_description"), key: "description", type: "text" },
    ],
    [t]
  );

  const getCarImage = (car) => {
    if (!car) return "https://via.placeholder.com/400x240?text=No+Image";
    if (car.image && car.image.trim() !== "") return car.image;
    if (Array.isArray(car.images) && car.images.length > 0) return car.images[0];
    return "https://via.placeholder.com/400x240?text=No+Image";
  };

  const formatValue = (car, row) => {
    if (!car) return t("dash");

    const value = car[row.key];

    if (row.type === "price") {
      const locale = i18n.language === "en" ? "en-US" : "vi-VN";
      return value ? `${Number(value).toLocaleString(locale)}đ` : t("dash");
    }

    if (row.key === "status") {
      if (value === "available") return t("status_available");
      if (value === "reserved") return t("status_reserved");
      if (value === "sold") return t("status_sold");
      if (value === "hidden") return t("status_hidden");
      return value || t("dash");
    }

    return value || t("dash");
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <MainNavbar />

      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #020617 0%, #081226 100%)",
          padding: "48px 20px",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ marginBottom: "28px" }}>
            <p
              style={{
                color: "#60a5fa",
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              {t("btn_compare")}
            </p>

            <h1
              style={{
                color: "#fff",
                fontSize: "52px",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {t("compare_title")}
            </h1>

            <p style={{ color: "#cbd5e1", marginTop: "12px" }}>
              {t("compare_desc")}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "22px",
            }}
          >
            <div style={{ color: "#cbd5e1" }}>
              {t("compare_count", { count: cars.length })}
            </div>

            {cars.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#fff",
                  borderRadius: "12px",
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {t("compare_clear_all")}
              </button>
            )}
          </div>

          {message && cars.length === 0 ? (
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "20px",
                padding: "24px",
                color: "#cbd5e1",
              }}
            >
              {message}
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "24px",
                padding: "18px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "980px",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  color: "#fff",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "18px 16px",
                        width: "220px",
                        color: "#93c5fd",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {t("compare_criteria")}
                    </th>

                    {cars.map((car) => (
                      <th
                        key={car._id}
                        style={{
                          textAlign: "center",
                          padding: "18px 16px",
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                          verticalAlign: "top",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gap: "10px",
                            justifyItems: "center",
                          }}
                        >
                          <strong>{car.name}</strong>

                          <button
                            type="button"
                            onClick={() => handleRemove(car._id)}
                            style={{
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(239,68,68,0.12)",
                              color: "#fca5a5",
                              borderRadius: "10px",
                              padding: "8px 12px",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            {t("delete")}
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.key}>
                      <td
                        style={{
                          padding: "18px 16px",
                          color: "#cbd5e1",
                          fontWeight: 700,
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                          verticalAlign: "top",
                        }}
                      >
                        {row.label}
                      </td>

                      {cars.map((car) => (
                        <td
                          key={`${row.key}-${car._id}`}
                          style={{
                            padding: "18px 16px",
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                            color: "#e5e7eb",
                            textAlign: row.type === "image" ? "center" : "left",
                            verticalAlign: "top",
                          }}
                        >
                          {row.type === "image" ? (
                            <img
                              src={getCarImage(car)}
                              alt={car.name}
                              style={{
                                width: "100%",
                                maxWidth: "240px",
                                height: "150px",
                                objectFit: "cover",
                                borderRadius: "16px",
                              }}
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/400x240?text=No+Image";
                              }}
                            />
                          ) : row.type === "text" ? (
                            <div style={{ lineHeight: 1.6 }}>
                              {formatValue(car, row)}
                            </div>
                          ) : (
                            formatValue(car, row)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}