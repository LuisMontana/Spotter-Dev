import "./DaySelector.css";

export default function DaySelector({ days, activeIndex, onSelect }) {
  return (
    <div className="day-selector">
      {days.map((day, i) => (
        <button
          key={day.date}
          className={`day-selector__tab ${i === activeIndex ? "is-active" : ""}`}
          onClick={() => onSelect(i)}
        >
          Day {i + 1}
          <span>{day.date}</span>
        </button>
      ))}
    </div>
  );
}
