import { useMemo } from "react";
import "./LogSheet.css";

const ROWS = [
  { key: "off_duty", label: "Off Duty" },
  { key: "sleeper_berth", label: "Sleeper Berth" },
  { key: "driving", label: "Driving" },
  { key: "on_duty_not_driving", label: "On Duty (Not Driving)" },
];

const STATUS_COLOR = {
  off_duty: "var(--status-off-duty)",
  sleeper_berth: "var(--status-sleeper-berth)",
  driving: "var(--status-driving)",
  on_duty_not_driving: "var(--status-on-duty-not-driving)",
};

const GRID_LEFT = 150;
const GRID_RIGHT = 990;
const GRID_TOP = 26;
const ROW_HEIGHT = 42;
const GRID_WIDTH = GRID_RIGHT - GRID_LEFT;

function hourOfDay(isoString, dateString) {
  const t = new Date(isoString);
  const dayStart = new Date(`${dateString}T00:00:00`);
  return (t - dayStart) / 3600000;
}

export default function LogSheet({ day }) {
  const rowY = Object.fromEntries(
    ROWS.map((r, i) => [r.key, GRID_TOP + i * ROW_HEIGHT + ROW_HEIGHT / 2])
  );
  const gridHeight = ROWS.length * ROW_HEIGHT;

  const plotted = useMemo(
    () =>
      day.segments.map((seg) => ({
        ...seg,
        x1: GRID_LEFT + (hourOfDay(seg.start, day.date) / 24) * GRID_WIDTH,
        x2: GRID_LEFT + (hourOfDay(seg.end, day.date) / 24) * GRID_WIDTH,
        y: rowY[seg.status],
      })),
    [day]
  );

  return (
    <div className="log-sheet">
      <div className="log-sheet__date">{day.date}</div>

      <svg viewBox={`0 0 1000 ${GRID_TOP + gridHeight + 20}`} className="log-sheet__svg">
        {Array.from({ length: 25 }).map((_, h) => {
          const x = GRID_LEFT + (h / 24) * GRID_WIDTH;
          return (
            <g key={h}>
              <line
                x1={x}
                y1={GRID_TOP}
                x2={x}
                y2={GRID_TOP + gridHeight}
                stroke="var(--border-hairline)"
                strokeWidth={h % 6 === 0 ? 1.2 : 0.5}
              />
              {h % 2 === 0 && (
                <text
                  x={x}
                  y={GRID_TOP - 8}
                  fontSize="9"
                  textAnchor="middle"
                  fill="var(--text-dim)"
                  fontFamily="var(--font-mono)"
                >
                  {h === 0 ? "M" : h === 12 ? "N" : h % 12}
                </text>
              )}
            </g>
          );
        })}

        {ROWS.map((r, i) => {
          const y = GRID_TOP + i * ROW_HEIGHT;
          return (
            <g key={r.key}>
              <line x1={GRID_LEFT} y1={y} x2={GRID_RIGHT} y2={y} stroke="var(--border-hairline)" />
              <text
                x={GRID_LEFT - 10}
                y={y + ROW_HEIGHT / 2 + 4}
                fontSize="10.5"
                textAnchor="end"
                fill="var(--text-muted)"
              >
                {r.label}
              </text>
            </g>
          );
        })}
        <line
          x1={GRID_LEFT}
          y1={GRID_TOP + gridHeight}
          x2={GRID_RIGHT}
          y2={GRID_TOP + gridHeight}
          stroke="var(--border-hairline)"
        />

        {plotted.map((seg, i) => {
          const prev = plotted[i - 1];
          return (
            <g key={i}>
              {prev && prev.status !== seg.status && (
                <line
                  x1={seg.x1}
                  y1={prev.y}
                  x2={seg.x1}
                  y2={seg.y}
                  stroke={STATUS_COLOR[seg.status]}
                  strokeWidth={2}
                />
              )}
              <line
                x1={seg.x1}
                y1={seg.y}
                x2={seg.x2}
                y2={seg.y}
                stroke={STATUS_COLOR[seg.status]}
                strokeWidth={2.75}
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>

      <div className="log-sheet__totals">
        {ROWS.map((r) => (
          <div key={r.key} className="log-sheet__total">
            <span className="dot" style={{ background: STATUS_COLOR[r.key] }} />
            {r.label}
            <strong>{(day.totals_hours[r.key] ?? 0).toFixed(2)}h</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
