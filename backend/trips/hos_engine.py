from dataclasses import dataclass
from datetime import datetime, timedelta

DUTY_OFF = "off_duty"
DUTY_SLEEPER = "sleeper_berth"
DUTY_DRIVING = "driving"
DUTY_ON_NOT_DRIVING = "on_duty_not_driving"

FUEL_STOP_INTERVAL_MILES = 1000
FUEL_STOP_DURATION_HOURS = 0.5
PICKUP_DURATION_HOURS = 1.0
DROPOFF_DURATION_HOURS = 1.0

MAX_DRIVE_HOURS_PER_SHIFT = 11
MAX_DUTY_WINDOW_HOURS = 14
BREAK_REQUIRED_AFTER_DRIVE_HOURS = 8
BREAK_DURATION_HOURS = 0.5
MIN_OFF_DUTY_HOURS = 10
CYCLE_LIMIT_HOURS = 70
RESTART_HOURS = 34

EPS = 1e-6


@dataclass
class Segment:
    status: str
    start: datetime
    end: datetime
    label: str = ""
    location: str = ""

    @property
    def duration_hours(self) -> float:
        return (self.end - self.start).total_seconds() / 3600

    def to_dict(self):
        return {
            "status": self.status,
            "start": self.start.isoformat(),
            "end": self.end.isoformat(),
            "duration_hours": round(self.duration_hours, 2),
            "label": self.label,
            "location": self.location,
        }


class _ShiftState:
    def __init__(self, clock: datetime, cycle_hours_used: float):
        self.clock = clock
        self.cycle_hours_used = cycle_hours_used
        self.drive_hours_since_last_break = 0.0
        self.drive_hours_in_shift = 0.0
        self.duty_window_start = clock
        self.miles_since_fuel = 0.0


def plan_trip(
    pickup_location: str,
    dropoff_location: str,
    current_cycle_used_hours: float,
    deadhead_miles: float,
    deadhead_hours: float,
    loaded_miles: float,
    loaded_hours: float,
    start_time: datetime | None = None,
) -> list[Segment]:
    start_time = start_time or datetime.utcnow().replace(
        minute=0, second=0, microsecond=0
    )
    state = _ShiftState(clock=start_time, cycle_hours_used=current_cycle_used_hours)
    segments: list[Segment] = []

    def start_new_duty_window():
        state.duty_window_start = state.clock
        state.drive_hours_in_shift = 0.0
        state.drive_hours_since_last_break = 0.0

    def add_segment(status, hours, label="", location=""):
        if hours <= EPS:
            return
        seg_start = state.clock
        seg_end = seg_start + timedelta(hours=hours)
        segments.append(Segment(status, seg_start, seg_end, label, location))
        state.clock = seg_end
        if status in (DUTY_DRIVING, DUTY_ON_NOT_DRIVING):
            state.cycle_hours_used += hours
        if status == DUTY_DRIVING:
            state.drive_hours_in_shift += hours
            state.drive_hours_since_last_break += hours

    def take_restart():
        add_segment(DUTY_OFF, RESTART_HOURS, "34-hour restart")
        state.cycle_hours_used = 0.0
        start_new_duty_window()

    def take_daily_reset():
        add_segment(DUTY_SLEEPER, MIN_OFF_DUTY_HOURS, "Required 10-hour rest")
        start_new_duty_window()

    def drive(total_hours, total_miles, dest_label):
        remaining_hours = total_hours

        while remaining_hours > EPS:
            if state.cycle_hours_used >= CYCLE_LIMIT_HOURS - EPS:
                take_restart()
                continue

            cycle_room = CYCLE_LIMIT_HOURS - state.cycle_hours_used
            shift_drive_room = MAX_DRIVE_HOURS_PER_SHIFT - state.drive_hours_in_shift
            window_room = MAX_DUTY_WINDOW_HOURS - (
                (state.clock - state.duty_window_start).total_seconds() / 3600
            )
            break_room = BREAK_REQUIRED_AFTER_DRIVE_HOURS - state.drive_hours_since_last_break

            if shift_drive_room <= EPS or window_room <= EPS:
                take_daily_reset()
                continue
            if break_room <= EPS:
                add_segment(DUTY_OFF, BREAK_DURATION_HOURS, "30-minute break")
                state.drive_hours_since_last_break = 0.0
                continue

            miles_to_next_fuel = FUEL_STOP_INTERVAL_MILES - state.miles_since_fuel
            hours_to_next_fuel = (
                (miles_to_next_fuel / total_miles) * total_hours
                if total_miles > 0
                else float("inf")
            )

            chunk_hours = min(
                remaining_hours,
                cycle_room,
                shift_drive_room,
                window_room,
                break_room,
                hours_to_next_fuel if hours_to_next_fuel > EPS else remaining_hours,
            )
            chunk_hours = max(chunk_hours, 0.01)
            chunk_miles = (chunk_hours / total_hours) * total_miles if total_hours > 0 else 0

            add_segment(DUTY_DRIVING, chunk_hours, f"Driving toward {dest_label}")
            state.miles_since_fuel += chunk_miles
            remaining_hours -= chunk_hours

            if state.miles_since_fuel >= FUEL_STOP_INTERVAL_MILES - EPS and remaining_hours > EPS:
                add_segment(DUTY_ON_NOT_DRIVING, FUEL_STOP_DURATION_HOURS, "Fuel stop")
                state.miles_since_fuel = 0.0

    if deadhead_hours > EPS:
        drive(deadhead_hours, deadhead_miles, "pickup")

    add_segment(DUTY_ON_NOT_DRIVING, PICKUP_DURATION_HOURS, "Pickup", pickup_location)

    drive(loaded_hours, loaded_miles, "drop-off")

    add_segment(DUTY_ON_NOT_DRIVING, DROPOFF_DURATION_HOURS, "Drop-off", dropoff_location)

    return segments

def split_into_daily_logs(segments: list[Segment]) -> list[dict]:
    if not segments:
        return []

    days: dict[object, list[Segment]] = {}
    for seg in segments:
        cursor = seg.start
        while cursor < seg.end:
            day_key = cursor.date()
            next_midnight = datetime(
                cursor.year, cursor.month, cursor.day
            ) + timedelta(days=1)
            piece_end = min(seg.end, next_midnight)
            days.setdefault(day_key, []).append(
                Segment(seg.status, cursor, piece_end, seg.label, seg.location)
            )
            cursor = piece_end

    result = []
    for day_key in sorted(days.keys()):
        day_segments = days[day_key]
        totals = {
            DUTY_OFF: 0.0,
            DUTY_SLEEPER: 0.0,
            DUTY_DRIVING: 0.0,
            DUTY_ON_NOT_DRIVING: 0.0,
        }
        for seg in day_segments:
            totals[seg.status] += seg.duration_hours

        result.append(
            {
                "date": day_key.isoformat(),
                "segments": [seg.to_dict() for seg in day_segments],
                "totals_hours": {k: round(v, 2) for k, v in totals.items()},
            }
        )

    return result
