"use server";

import { requireBusiness } from "@/lib/auth/session";
import { renderReminderMessage } from "@/lib/whatsapp/message";
import { buildWhatsAppUrl } from "@/lib/whatsapp/url";
import { formatDate, formatTime } from "@/lib/dates/format";
import { formatClientName } from "@/lib/clients/name";

export type ReminderUrlResult = {
  error?: string;
  url?: string;
  clientName?: string;
};

/**
 * Construye la URL de wa.me para el recordatorio de una cita, usando la
 * plantilla configurada en business_settings (SPEC.md sección 17). Corre en
 * servidor para no exponer la consulta de plantilla/datos al cliente
 * directamente, aunque el resultado (URL) sí se abre en el navegador.
 */
export async function buildReminderUrlForAppointment(
  appointmentId: string,
): Promise<ReminderUrlResult> {
  const { supabase, businessId, business } = await requireBusiness();
  const timezone = business?.timezone ?? "Europe/Madrid";

  const { data: appointment } = await supabase
    .from("appointments")
    .select("starts_at, clients(first_name, last_name, phone), services(name)")
    .eq("id", appointmentId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!appointment || !appointment.clients) {
    return { error: "No se encontró la cita." };
  }

  const { data: settings } = await supabase
    .from("business_settings")
    .select("default_reminder_template")
    .eq("business_id", businessId)
    .maybeSingle();

  const template =
    settings?.default_reminder_template ??
    "Hola {{client_name}}, te recordamos tu cita de {{service}} el {{date}} a las {{time}} en {{business_name}}. ¡Te esperamos!";

  const message = renderReminderMessage(template, {
    clientName: appointment.clients.first_name,
    service: appointment.services?.name ?? "tu cita",
    date: formatDate(appointment.starts_at, timezone),
    time: formatTime(appointment.starts_at, timezone),
    businessName: business?.name ?? "",
  });

  const url = buildWhatsAppUrl(appointment.clients.phone, message);

  return {
    url,
    clientName: formatClientName(appointment.clients.first_name, appointment.clients.last_name),
  };
}
