import { describe, expect, it } from "vitest";
import { clientSchema } from "./client";

describe("clientSchema", () => {
  it("acepta un cliente válido con apellido y notas", () => {
    const result = clientSchema.safeParse({
      firstName: "María",
      lastName: "López",
      phone: "+34600111222",
      notes: "Prefiere citas por la mañana",
    });
    expect(result.success).toBe(true);
  });

  it("acepta un cliente sin apellido ni notas (opcionales)", () => {
    const result = clientSchema.safeParse({
      firstName: "María",
      phone: "+34600111222",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza nombre vacío", () => {
    const result = clientSchema.safeParse({ firstName: "", phone: "+34600111222" });
    expect(result.success).toBe(false);
  });

  it("rechaza nombre con solo espacios", () => {
    const result = clientSchema.safeParse({ firstName: "   ", phone: "+34600111222" });
    expect(result.success).toBe(false);
  });

  it("rechaza teléfono vacío", () => {
    const result = clientSchema.safeParse({ firstName: "María", phone: "" });
    expect(result.success).toBe(false);
  });

  it("rechaza notas demasiado largas", () => {
    const result = clientSchema.safeParse({
      firstName: "María",
      phone: "+34600111222",
      notes: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});
