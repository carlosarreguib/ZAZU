import { describe, expect, it } from "vitest";
import { appointmentSchema } from "./appointment";

const VALID = {
  clientId: "1e6f8b0a-1234-4abc-8def-000000000001",
  serviceId: "1e6f8b0a-1234-4abc-8def-000000000002",
  date: "2026-09-03",
  time: "10:00",
  durationMinutes: "50",
};

describe("appointmentSchema", () => {
  it("acepta una cita válida completa", () => {
    const result = appointmentSchema.safeParse(VALID);
    expect(result.success).toBe(true);
  });

  it("acepta sin serviceId (opcional)", () => {
    const rest: Partial<typeof VALID> = { ...VALID };
    delete rest.serviceId;
    const result = appointmentSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("rechaza un clientId que no es UUID", () => {
    const result = appointmentSchema.safeParse({ ...VALID, clientId: "no-es-uuid" });
    expect(result.success).toBe(false);
  });

  it("rechaza una hora con formato inválido", () => {
    const result = appointmentSchema.safeParse({ ...VALID, time: "10h00" });
    expect(result.success).toBe(false);
  });

  it("rechaza duración cero o negativa", () => {
    expect(appointmentSchema.safeParse({ ...VALID, durationMinutes: "0" }).success).toBe(
      false,
    );
    expect(
      appointmentSchema.safeParse({ ...VALID, durationMinutes: "-10" }).success,
    ).toBe(false);
  });

  it("rechaza fecha vacía", () => {
    const result = appointmentSchema.safeParse({ ...VALID, date: "" });
    expect(result.success).toBe(false);
  });

  it("coacciona durationMinutes de string a number", () => {
    const result = appointmentSchema.safeParse(VALID);
    if (result.success) {
      expect(result.data.durationMinutes).toBe(50);
      expect(typeof result.data.durationMinutes).toBe("number");
    }
  });
});
