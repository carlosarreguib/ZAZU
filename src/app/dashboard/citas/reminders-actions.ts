"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/auth/session";

export type ReminderResult = { error?: string };

/**
 * Crea (si no existe) o actualiza a "prepared" el recordatorio de una cita,
 * justo antes de abrir WhatsApp (SPEC.md sección 15, paso 4).
 */
export async function markReminderPrepared(
  appointmentId: string,
): Promise<ReminderResult> {
  const { supabase, businessId } = await requireBusiness();

  const { data: existing } = await supabase
    .from("appointment_reminders")
    .select("id")
    .eq("appointment_id", appointmentId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("appointment_reminders")
      .update({ status: "prepared" })
      .eq("id", existing.id);
    if (error) return { error: "No se pudo preparar el recordatorio." };
  } else {
    const { error } = await supabase.from("appointment_reminders").insert({
      business_id: businessId,
      appointment_id: appointmentId,
      channel: "whatsapp",
      status: "prepared",
    });
    if (error) return { error: "No se pudo preparar el recordatorio." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/citas");
  return {};
}

/**
 * Marca el recordatorio como enviado. IMPORTANTE (SPEC.md sección 6/17):
 * esto significa que el usuario ha confirmado en Zazú que ha pulsado
 * "Enviar" en WhatsApp — Zazú no puede verificar el envío real.
 */
export async function markReminderSent(
  appointmentId: string,
): Promise<ReminderResult> {
  const { supabase, businessId } = await requireBusiness();

  const { data: existing } = await supabase
    .from("appointment_reminders")
    .select("id")
    .eq("appointment_id", appointmentId)
    .eq("business_id", businessId)
    .maybeSingle();

  const sentAt = new Date().toISOString();

  if (existing) {
    const { error } = await supabase
      .from("appointment_reminders")
      .update({ status: "sent", sent_at: sentAt })
      .eq("id", existing.id);
    if (error) return { error: "No se pudo marcar el recordatorio como enviado." };
  } else {
    const { error } = await supabase.from("appointment_reminders").insert({
      business_id: businessId,
      appointment_id: appointmentId,
      channel: "whatsapp",
      status: "sent",
      sent_at: sentAt,
    });
    if (error) return { error: "No se pudo marcar el recordatorio como enviado." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/citas");
  return {};
}
