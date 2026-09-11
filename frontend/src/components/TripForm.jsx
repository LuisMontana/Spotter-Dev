import { useState } from "react";
import "./TripForm.css";

const initialState = {
  current_location: "",
  pickup_location: "",
  dropoff_location: "",
  current_cycle_used: "",
};

export default function TripForm({ onSubmit, loading }) {
  const [form, setForm] = useState(initialState);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      current_cycle_used: parseFloat(form.current_cycle_used) || 0,
    });
  }

  return (
    <aside className="trip-form">
      <h1 className="trip-form__title">Trip planner</h1>

      <form onSubmit={handleSubmit}>
        <label className="field">
          <span>Current location</span>
          <input
            type="text"
            placeholder="Denver, CO"
            value={form.current_location}
            onChange={(e) => update("current_location", e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Pickup location</span>
          <input
            type="text"
            placeholder="Dallas, TX"
            value={form.pickup_location}
            onChange={(e) => update("pickup_location", e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Drop-off location</span>
          <input
            type="text"
            placeholder="Chicago, IL"
            value={form.dropoff_location}
            onChange={(e) => update("dropoff_location", e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Current cycle used (hrs)</span>
          <input
            type="number"
            min="0"
            max="70"
            step="0.5"
            placeholder="0"
            value={form.current_cycle_used}
            onChange={(e) => update("current_cycle_used", e.target.value)}
            required
          />
        </label>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Planning\u2026" : "Plan trip"}
        </button>
      </form>
      <div className="trip-form__notes">
        <div className="trip-form__notes-title">Notes</div>
        <ul>
          <li>Please add the state short-hand, otherwise it might fail to correctly pinpoint the locations</li>
        </ul>
      </div>
    </aside>
  );
}
