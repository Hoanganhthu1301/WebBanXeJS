import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function ShowroomMap({ showrooms = [], userLocation = null }) {
  const defaultCenter =
    userLocation || (showrooms[0] ? [showrooms[0].latitude, showrooms[0].longitude] : [10.7769, 106.7009]);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      style={{ height: "540px", width: "100%", borderRadius: "18px" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userLocation && (
        <CircleMarker center={userLocation} radius={10}>
          <Popup>Vị trí của bạn</Popup>
        </CircleMarker>
      )}

      {showrooms.map((item) => (
        <Marker key={item._id} position={[item.latitude, item.longitude]}>
          <Popup>
            <div style={{ minWidth: 220 }}>
              <h4 style={{ marginBottom: 8 }}>{item.name}</h4>
              <p>{item.address}</p>
              <p>SĐT: {item.phone || "—"}</p>
              <p>Giờ mở cửa: {item.openHours || "—"}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Chỉ đường đến {item.name}
                </a>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${item.name} ${item.address}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Xem vị trí {item.name}
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}