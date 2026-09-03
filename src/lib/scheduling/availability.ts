import { fromZonedTime } from "date-fns-tz";
import type { DayAppointmentItem } from "@/components/dashboard/day-appointments";

export type AvailabilityBlock =
  | { type: "free"; startsAt: string; endsAt: string }
  | { type: "busy"; startsAt: string; endsAt: string; appointment: DayAppointmentItem };

type DayHours = {
  isOpen: boolean;
  startsAt: string | null; // "HH:mm" o "HH:mm:ss"
  endsAt: string | null;
};

function toHhMm(time: string): string {
  return time.slice(0, 5);
}

function localTimeToUtcIso(dateStr: string, hhmm: string, timezone: string): string {
  return fromZonedTime(`${dateStr}T${hhmm}:00`, timezone).toISOString();
}

export function computeDayAvailability(params: {
  dateStr: string;
  timezone: string;
  hours: DayHours | null;
  appointments: DayAppointmentItem[];
  slotMinutes?: number;
}): AvailabilityBlock[] {
  const { dateStr, timezone, hours, appointments, slotMinutes = 30 } = params;

  if (!hours || !hours.isOpen || !hours.startsAt || !hours.endsAt) {
    return [];
  }

  const workStart = localTimeToUtcIso(dateStr, toHhMm(hours.startsAt), timezone);
  const workEnd = localTimeToUtcIso(dateStr, toHhMm(hours.endsAt), timezone);

  const sorted = [...appointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const blocks: AvailabilityBlock[] = [];
  let cursor = workStart;

  for (const appointment of sorted) {
    const apptStart = appointment.startsAt;
    const apptEnd = new Date(
      new Date(appointment.startsAt).getTime() + (appointment.durationMinutes ?? 0) * 60_000,
    ).toISOString();

    const clippedStart = apptStart < workStart ? workStart : apptStart;
    const clippedEnd = apptEnd > workEnd ? workEnd : apptEnd;

    if (clippedEnd <= cursor || clippedStart >= workEnd) {
      // La cita cae fuera del rango restante (ya cubierta o después del cierre).
      continue;
    }

    const gapMinutes = (new Date(clippedStart).getTime() - new Date(cursor).getTime()) / 60_000;
    if (gapMinutes >= slotMinutes) {
      blocks.push({ type: "free", startsAt: cursor, endsAt: clippedStart });
    }

    blocks.push({ type: "busy", startsAt: clippedStart, endsAt: clippedEnd, appointment });
    cursor = clippedEnd > cursor ? clippedEnd : cursor;
  }

  const tailMinutes = (new Date(workEnd).getTime() - new Date(cursor).getTime()) / 60_000;
  if (tailMinutes >= slotMinutes) {
    blocks.push({ type: "free", startsAt: cursor, endsAt: workEnd });
  }

  return blocks;
}
