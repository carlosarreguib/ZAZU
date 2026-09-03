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

  const sorted = [...appointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  // Las citas reales nunca se ocultan ni se recortan, sea cual sea la configuración
  // de horario laboral (puede haber cambiado después de crear la cita, o no existir).
  const busyBlocks: AvailabilityBlock[] = sorted.map((appointment) => {
    const apptEnd = new Date(
      new Date(appointment.startsAt).getTime() + (appointment.durationMinutes ?? 0) * 60_000,
    ).toISOString();
    return { type: "busy", startsAt: appointment.startsAt, endsAt: apptEnd, appointment };
  });

  if (!hours || !hours.isOpen || !hours.startsAt || !hours.endsAt) {
    // Sin horario laboral configurado (o día cerrado) no hay nada que ofrecer como
    // libre, pero las citas reales del día siguen mostrándose.
    return busyBlocks;
  }

  const workStart = localTimeToUtcIso(dateStr, toHhMm(hours.startsAt), timezone);
  const workEnd = localTimeToUtcIso(dateStr, toHhMm(hours.endsAt), timezone);

  const blocks: AvailabilityBlock[] = [];
  let cursor = workStart;

  for (const busy of busyBlocks) {
    // Los huecos libres solo se calculan dentro de la ventana de horario laboral;
    // una cita fuera de esa ventana no afecta al cálculo de libres pero sí se añade
    // como bloque ocupado con su horario real.
    const overlapsWindow = busy.endsAt > workStart && busy.startsAt < workEnd;

    if (overlapsWindow) {
      const gapMinutes = (new Date(busy.startsAt).getTime() - new Date(cursor).getTime()) / 60_000;
      if (gapMinutes >= slotMinutes) {
        blocks.push({ type: "free", startsAt: cursor, endsAt: busy.startsAt });
      }
      if (busy.endsAt > cursor) {
        cursor = busy.endsAt;
      }
    }

    blocks.push(busy);
  }

  const cursorClamped = cursor > workEnd ? workEnd : cursor;
  const tailMinutes = (new Date(workEnd).getTime() - new Date(cursorClamped).getTime()) / 60_000;
  if (tailMinutes >= slotMinutes) {
    blocks.push({ type: "free", startsAt: cursorClamped, endsAt: workEnd });
  }

  // Reordenar cronológicamente: las citas fuera de la ventana laboral (o el bloque
  // libre final) pueden haberse añadido sin quedar ya en orden respecto al resto.
  blocks.sort((a, b) => a.startsAt.localeCompare(b.startsAt) || (a.type === "free" ? -1 : 1));

  return blocks;
}
