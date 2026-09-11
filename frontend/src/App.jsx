import { useState } from "react";
import TripForm from "./components/TripForm";
import MapView from "./components/MapView";

export default function App() {
  const testRoute = {
    current_location: {
      name: "Denver, CO",
      coordinates: [-104.985798, 39.740959],
    },
    pickup_location: {
      name: "Dallas, TX",
      coordinates: [-96.784359, 32.736212],
    },
    dropoff_location: {
      name: "Chicago, IL",
      coordinates: [-87.66063, 41.87897],
    },
    deadhead_geometry: [
      [-104.985798, 39.740959],
      [-101.5, 37.0],
      [-98.5, 34.5],
      [-96.784359, 32.736212],
    ],
    loaded_geometry: [
      [-96.784359, 32.736212],
      [-94.0, 35.5],
      [-91.0, 38.5],
      [-87.66063, 41.87897],
    ],
    total_distance_miles: 1756.7,
    total_drive_hours: 40.6,
  };

  const [loading, setLoading] = useState(false);

  async function handleSubmit(payload) {
  }

  return (
    <div className="app-shell">
      <TripForm onSubmit={handleSubmit} loading={loading} />

      <div className="main-panel">
        <div className="app-header">
          <h1>Trip route &amp; daily logs</h1>
        </div>

        <MapView route={testRoute} />
      </div>
    </div>
  );
}
