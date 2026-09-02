import { describe, expect, it } from "vitest";
import { buildWhatsAppUrl } from "./url";

describe("buildWhatsAppUrl", () => {
  it("genera una URL wa.me con el número normalizado y el texto codificado", () => {
    const url = buildWhatsAppUrl("+34600112233", "Hola, ¿qué tal?");
    expect(url).toBe(
      "https://wa.me/34600112233?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F",
    );
  });

  it("no incluye '+' ni ceros de marcación internacional en la URL final", () => {
    const url = buildWhatsAppUrl("0034600112233", "Test");
    expect(url.startsWith("https://wa.me/34600112233?")).toBe(true);
    expect(url).not.toContain("+");
    expect(url).not.toContain("0034");
  });

  it("codifica correctamente caracteres especiales del mensaje", () => {
    const url = buildWhatsAppUrl("600112233", "50% de descuento & más");
    const params = new URL(url).searchParams;
    expect(params.get("text")).toBe("50% de descuento & más");
  });
});
