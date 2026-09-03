import { describe, expect, it } from "vitest";
import { formatClientName } from "./name";

describe("formatClientName", () => {
  it("combina nombre y apellido cuando ambos existen", () => {
    expect(formatClientName("María", "López")).toBe("María López");
  });

  it("devuelve solo el nombre cuando no hay apellido", () => {
    expect(formatClientName("María", null)).toBe("María");
    expect(formatClientName("María", undefined)).toBe("María");
    expect(formatClientName("María", "")).toBe("María");
  });
});
