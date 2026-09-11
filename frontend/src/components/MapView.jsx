import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.css";

// Leaflet's default marker icons reference image paths don't resolve correctly under Vite's bundling
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

function toLatLng([lon, lat]) {
  return [lat, lon];
}

export default function MapView({ route }) {
  if (!route) {
    return (
      <div className="map-placeholder">
        <span>Route will appear here once a trip is planned.</span>
      </div>
    );
  }

  const deadheadLine = route.deadhead_geometry.map(toLatLng);
  const loadedLine = route.loaded_geometry.map(toLatLng);
  const center = loadedLine[Math.floor(loadedLine.length / 2)] || deadheadLine[0];

  return (
    <div className="map-view">
      <MapContainer center={center} zoom={5} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={deadheadLine} pathOptions={{ color: "#5b6470", weight: 3, dashArray: "6 6" }} />
        <Polyline positions={loadedLine} pathOptions={{ color: "#f2a93b", weight: 4 }} />

        <Marker position={toLatLng(route.current_location.coordinates)}>
          <Popup>Current location — {route.current_location.name}</Popup>
        </Marker>
        <Marker position={toLatLng(route.pickup_location.coordinates)}>
          <Popup>Pickup — {route.pickup_location.name}</Popup>
        </Marker>
        <Marker position={toLatLng(route.dropoff_location.coordinates)}>
          <Popup>Drop-off — {route.dropoff_location.name}</Popup>
        </Marker>
      </MapContainer>

      <div className="map-stats">
        <div>
          <span className="map-stats__label">Distance</span>
          <span className="map-stats__value">{route.total_distance_miles} mi</span>
        </div>
        <div>
          <span className="map-stats__label">Drive time</span>
          <span className="map-stats__value">{route.total_drive_hours} hrs</span>
        </div>
      </div>
    </div>
  );
}
