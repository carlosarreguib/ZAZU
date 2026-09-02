/**
 * Generación de mensaje de recordatorio a partir de la plantilla del
 * negocio (SPEC.md sección 17). Variables soportadas: {{client_name}},
 * {{service}}, {{date}}, {{time}}, {{business_name}}.
 */
export type ReminderMessageVars = {
  clientName: string;
  service: string;
  date: string;
  time: string;
  businessName: string;
};

export function renderReminderMessage(
  template: string,
  vars: ReminderMessageVars,
): string {
  return template
    .replaceAll("{{client_name}}", vars.clientName)
    .replaceAll("{{service}}", vars.service)
    .replaceAll("{{date}}", vars.date)
    .replaceAll("{{time}}", vars.time)
    .replaceAll("{{business_name}}", vars.businessName);
}
