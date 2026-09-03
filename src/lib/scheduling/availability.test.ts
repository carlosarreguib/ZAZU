import { describe, expect, it } from "vitest";
import { computeDayAvailability, type AvailabilityBlock } from "./availability";
import type { DayAppointmentItem } from "@/components/dashboard/day-appointments";

const TIMEZONE = "Europe/Madrid";
const DATE = "2026-09-03"; // jueves

function appt(overrides: Partial<DayAppointmentItem> & { startsAt: string; endsAt?: string }): DayAppointmentItem {
  return {
    id: "appt-1",
    clientName: "Cliente",
    serviceName: "Servicio",
    durationMinutes: 30,
    status: "scheduled",
    reminderStatus: null,
    ...overrides,
  };
}

describe("computeDayAvailability", () => {
  it("devuelve [] si el día está cerrado y no hay citas", () => {
    const result = computeDayAvailability({
      dateStr: DATE,
      timezone: TIMEZONE,
      hours: { isOpen: false, startsAt: null, endsAt: null },
      appointments: [],
    });
    expect(result).toEqual([]);
  });

  it("devuelve [] si no hay fila de horario para ese día y no hay citas", () => {
    const result = computeDayAvailability({
      dateStr: DATE,
      timezone: TIMEZONE,
      hours: null,
      appointments: [],
    });
    expect(result).toEqual([]);
  });

  it("un día cerrado con una cita existente sigue mostrando esa cita como ocupada, sin bloques libres", () => {
    const busyAppt = appt({
      id: "appt-closed-day",
      startsAt: "2026-09-03T09:00:00.000Z", // 11:00 local
    });
    const result = computeDayAvailability({
      dateStr: DATE,
      timezone: TIMEZONE,
      hours: { isOpen: false, startsAt: null, endsAt: null },
      appointments: [busyAppt],
    });

    expect(result).toEqual([
      {
        type: "busy",
        startsAt: "2026-09-03T09:00:00.000Z",
        endsAt: "2026-09-03T09:30:00.000Z",
        appointment: busyAppt,
      },
    ] satisfies AvailabilityBlock[]);
  });

  it("una cita fuera del horario laboral (día abierto) sigue mostrándose como ocupada con su horario real", () => {
    const busyAppt = appt({
      id: "appt-outside-hours",
      startsAt: "2026-09-03T17:00:00.000Z", // 19:00 local, tras el cierre a las 18:00
    });
    const result = computeDayAvailability({
      dateStr: DATE,
      timezone: TIMEZONE,
      hours: { isOpen: true, startsAt: "09:00", endsAt: "18:00" },
      appointments: [busyAppt],
    });

    expect(result).toEqual([
      { type: "free", startsAt: "2026-09-03T07:00:00.000Z", endsAt: "2026-09-03T16:00:00.000Z" },
      {
        type: "busy",
        startsAt: "2026-09-03T17:00:00.000Z",
        endsAt: "2026-09-03T17:30:00.000Z",
        appointment: busyAppt,
      },
    ] satisfies AvailabilityBlock[]);
  });

  it("un día abierto sin citas es un único bloque libre de horario completo", () => {
    const result = computeDayAvailability({
      dateStr: DATE,
      timezone: TIMEZONE,
      hours: { isOpen: true, startsAt: "09:00", endsAt: "18:00" },
      appointments: [],
    });
    expect(result).toEqual([
      {
        type: "free",
        startsAt: "2026-09-03T07:00:00.000Z",
        endsAt: "2026-09-03T16:00:00.000Z",
      },
    ] satisfies AvailabilityBlock[]);
  });

  it("una cita en medio del horario genera libre-ocupado-libre", () => {
    const busyAppt = appt({
      id: "appt-mid",
      startsAt: "2026-09-03T09:00:00.000Z", // 11:00 en Europe/Madrid (CEST, UTC+2)
    });
    const result = computeDayAvailability({
      dateStr: DATE,
      timezone: TIMEZONE,
      hours: { isOpen: true, startsAt: "09:00", endsAt: "18:00" },
      appointments: [busyAppt],
      // la cita dura 30 min según appt(): 11:00-11:30 hora local
    });

    expect(result).toEqual([
      { type: "free", startsAt: "2026-09-03T07:00:00.000Z", endsAt: "2026-09-03T09:00:00.000Z" },
      { type: "busy", startsAt: "2026-09-03T09:00:00.000Z", endsAt: "2026-09-03T09:30:00.000Z", appointment: busyAppt },
      { type: "free", startsAt: "2026-09-03T09:30:00.000Z", endsAt: "2026-09-03T16:00:00.000Z" },
    ] satisfies AvailabilityBlock[]);
  });

  it("una cita que empieza antes del horario laboral se muestra con su horario real, sin recortar", () => {
    const busyAppt = appt({
      id: "appt-early",
      // 08:45 local (30 min de duración -> termina 09:15 local), a caballo de la apertura a las 09:00.
      startsAt: "2026-09-03T06:45:00.000Z", // 08:45 local, antes de las 09:00 de apertura
    });
    const result = computeDayAvailability({
      dateStr: DATE,
      timezone: TIMEZONE,
      hours: { isOpen: true, startsAt: "09:00", endsAt: "18:00" },
      appointments: [busyAppt],
    });

    expect(result[0]).toEqual({
      type: "busy",
      startsAt: "2026-09-03T06:45:00.000Z", // horario real de la cita (08:45 local), sin recortar al inicio del horario
      endsAt: "2026-09-03T07:15:00.000Z", // fin real de la cita (09:15 local)
      appointment: busyAppt,
    });
    // No debe generarse un bloque libre antes de una cita que ya empezó antes de la apertura.
    expect(result.find((b) => b.type === "free" && b.startsAt < "2026-09-03T06:45:00.000Z")).toBeUndefined();
  });

  it("descarta huecos libres menores al tamaño de slot (30 min por defecto)", () => {
    const first = appt({
      id: "appt-1",
      startsAt: "2026-09-03T07:00:00.000Z", // 09:00 local
    });
    const second = appt({
      id: "appt-2",
      startsAt: "2026-09-03T07:40:00.000Z", // 09:40 local, deja un hueco de 10 min tras la primera cita (09:30-09:40)
    });
    const result = computeDayAvailability({
      dateStr: DATE,
      timezone: TIMEZONE,
      hours: { isOpen: true, startsAt: "09:00", endsAt: "18:00" },
      appointments: [first, second],
    });

    const freeBlocks = result.filter((b) => b.type === "free");
    // No debe existir un hueco libre de 10 minutos entre las dos citas.
    expect(freeBlocks.some((b) => b.startsAt === "2026-09-03T07:30:00.000Z")).toBe(false);
  });

  it("varias citas seguidas sin hueco entre ellas no generan bloque libre intermedio", () => {
    const first = appt({ id: "appt-1", startsAt: "2026-09-03T07:00:00.000Z" }); // 09:00-09:30 local
    const second = appt({ id: "appt-2", startsAt: "2026-09-03T07:30:00.000Z" }); // 09:30-10:00 local, contigua
    const result = computeDayAvailability({
      dateStr: DATE,
      timezone: TIMEZONE,
      hours: { isOpen: true, startsAt: "09:00", endsAt: "18:00" },
      appointments: [first, second],
    });

    const busyBlocks = result.filter((b) => b.type === "busy");
    expect(busyBlocks).toHaveLength(2);
    expect(result.find((b) => b.type === "free" && b.startsAt === "2026-09-03T07:30:00.000Z")).toBeUndefined();
  });
});
