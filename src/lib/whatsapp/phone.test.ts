import { describe, expect, it } from "vitest";
import { normalizeSpanishPhone } from "./phone";

describe("normalizeSpanishPhone", () => {
  it("mantiene un número con prefijo +34", () => {
    expect(normalizeSpanishPhone("+34600112233")).toBe("34600112233");
  });

  it("convierte el prefijo de marcación internacional 0034", () => {
    expect(normalizeSpanishPhone("0034600112233")).toBe("34600112233");
  });

  it("asume España cuando no hay prefijo", () => {
    expect(normalizeSpanishPhone("600112233")).toBe("34600112233");
  });

  it("elimina espacios, guiones y paréntesis antes de normalizar", () => {
    expect(normalizeSpanishPhone("+34 600 11 22 33")).toBe("34600112233");
    expect(normalizeSpanishPhone("600-112-233")).toBe("34600112233");
    expect(normalizeSpanishPhone("(600) 112 233")).toBe("34600112233");
  });

  it("no duplica el prefijo si ya viene sin '+' pero con 34 delante", () => {
    expect(normalizeSpanishPhone("34600112233")).toBe("34600112233");
  });
});
