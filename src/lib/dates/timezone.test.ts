import { describe, expect, it } from "vitest";
import { zonedDateTimeToIso, addMinutesIso } from "./timezone";

describe("zonedDateTimeToIso", () => {
  it("convierte una hora de invierno en Europe/Madrid (UTC+1) a UTC", () => {
    // 15 de enero, 10:00 en Madrid (horario de invierno, sin DST) -> 09:00 UTC
    expect(zonedDateTimeToIso("2026-01-15", "10:00", "Europe/Madrid")).toBe(
      "2026-01-15T09:00:00.000Z",
    );
  });

  it("convierte una hora de verano en Europe/Madrid (UTC+2, DST) a UTC", () => {
    // 15 de julio, 10:00 en Madrid (horario de verano) -> 08:00 UTC
    expect(zonedDateTimeToIso("2026-07-15", "10:00", "Europe/Madrid")).toBe(
      "2026-07-15T08:00:00.000Z",
    );
  });

  it("no depende del timezone del servidor: distintos timezones dan distinto UTC", () => {
    const madrid = zonedDateTimeToIso("2026-06-01", "12:00", "Europe/Madrid");
    const utc = zonedDateTimeToIso("2026-06-01", "12:00", "UTC");
    expect(madrid).not.toBe(utc);
  });
});

describe("addMinutesIso", () => {
  it("suma la duración en minutos a un instante ISO", () => {
    expect(addMinutesIso("2026-09-03T09:00:00.000Z", 50)).toBe(
      "2026-09-03T09:50:00.000Z",
    );
  });

  it("cruza correctamente la medianoche", () => {
    expect(addMinutesIso("2026-09-03T23:40:00.000Z", 30)).toBe(
      "2026-09-04T00:10:00.000Z",
    );
  });

  it("con duración 0 devuelve el mismo instante", () => {
    expect(addMinutesIso("2026-09-03T09:00:00.000Z", 0)).toBe(
      "2026-09-03T09:00:00.000Z",
    );
  });
});
