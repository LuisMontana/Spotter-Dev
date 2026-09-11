import { useState } from "react";
import TripForm from "./components/TripForm";
import MapView from "./components/MapView";
import DaySelector from "./components/DaySelector";
import LogSheet from "./components/LogSheet";
import { planTrip } from "./api";

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState(0);

  async function handleSubmit(payload) {
    setLoading(true);
    setError(null);
    try {
      const data = await planTrip(payload);
      setResult(data);
      setActiveDay(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <TripForm onSubmit={handleSubmit} loading={loading} />

      <div className="main-panel">
        <div className="app-header">
          <h1>Trip route &amp; daily logs</h1>
        </div>

        <MapView route={result?.route} />

        {error && <div className="error-banner">{error}</div>}

        {result && (
          <>
            <DaySelector
              days={result.daily_logs}
              activeIndex={activeDay}
              onSelect={setActiveDay}
            />
            <div className="log-sheet-container">
              <LogSheet day={result.daily_logs[activeDay]} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
