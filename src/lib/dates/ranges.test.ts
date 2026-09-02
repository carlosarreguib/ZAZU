import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dayRangeUtc } from "./ranges";

describe("dayRangeUtc", () => {
  beforeEach(() => {
    // 2 de septiembre de 2026, 23:30 UTC = 3 de septiembre 01:30 en Madrid
    // (verano, UTC+2): elegido a propósito cerca de medianoche para
    // detectar errores de "día equivocado" por desfase de timezone.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-02T23:30:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calcula 'hoy' según el timezone del negocio, no el del servidor", () => {
    const today = dayRangeUtc("Europe/Madrid", 0);
    // Son las 01:30 del día 3 en Madrid, así que "hoy" para el negocio es el 3.
    expect(today.dateStr).toBe("2026-09-03");
  });

  it("calcula 'mañana' como el día calendario siguiente al de hoy en el negocio", () => {
    const tomorrow = dayRangeUtc("Europe/Madrid", 1);
    expect(tomorrow.dateStr).toBe("2026-09-04");
  });

  it("el rango [start, end] cubre exactamente el día en el timezone del negocio", () => {
    const { startIso, endIso } = dayRangeUtc("Europe/Madrid", 0);
    // 00:00 del 3 de sept en Madrid (verano, UTC+2) = 2026-09-02T22:00:00Z
    expect(startIso).toBe("2026-09-02T22:00:00.000Z");
    // 23:59:59.999 del 3 de sept en Madrid = 2026-09-03T21:59:59.999Z
    expect(endIso).toBe("2026-09-03T21:59:59.999Z");
  });

  it("usa el timezone del negocio, no UTC, cuando difieren", () => {
    const madridToday = dayRangeUtc("Europe/Madrid", 0);
    const utcToday = dayRangeUtc("UTC", 0);
    expect(madridToday.dateStr).not.toBe(utcToday.dateStr);
  });
});
