import { useState } from "react";
import TripForm from "./components/TripForm";

export default function App() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(payload) {
  }

  return (
    <div className="app-shell">
      <TripForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
