import { describe, expect, it } from "vitest";
import { renderReminderMessage } from "./message";

describe("renderReminderMessage", () => {
  const vars = {
    clientName: "María López",
    service: "Fisioterapia",
    date: "3 de septiembre",
    time: "10:00",
    businessName: "Clínica Demo",
  };

  it("sustituye todas las variables soportadas", () => {
    const template =
      "Hola {{client_name}}, te recordamos tu cita de {{service}} el {{date}} a las {{time}} en {{business_name}}. ¡Te esperamos!";
    expect(renderReminderMessage(template, vars)).toBe(
      "Hola María López, te recordamos tu cita de Fisioterapia el 3 de septiembre a las 10:00 en Clínica Demo. ¡Te esperamos!",
    );
  });

  it("sustituye variables repetidas más de una vez", () => {
    const template = "{{client_name}}, {{client_name}}!";
    expect(renderReminderMessage(template, vars)).toBe("María López, María López!");
  });

  it("deja intacto el texto sin variables", () => {
    expect(renderReminderMessage("Mensaje fijo sin variables", vars)).toBe(
      "Mensaje fijo sin variables",
    );
  });
});
