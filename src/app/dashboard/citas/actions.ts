"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/auth/session";
import { zonedDateTimeToIso } from "@/lib/dates/timezone";
import {
  appointmentSchema,
  appointmentStatusSchema,
} from "@/lib/validations/appointment";

export type AppointmentFormState = {
  error?: string;
  fieldErrors?: Partial<
    Record<"clientId" | "serviceId" | "date" | "time" | "durationMinutes", string>
  >;
  success?: boolean;
  appointmentId?: string;
};

/** true si el error de Postgres viene del EXCLUDE constraint anti-solapamiento. */
function isOverlapError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "23P01" ||
    Boolean(error.message?.includes("no_overlapping_appointments"))
  );
}

export async function createAppointment(
  _prevState: AppointmentFormState,
  formData: FormData,
): Promise<AppointmentFormState> {
  const parsed = appointmentSchema.safeParse({
    clientId: formData.get("clientId"),
    serviceId: formData.get("serviceId") || undefined,
    date: formData.get("date"),
    time: formData.get("time"),
    durationMinutes: formData.get("durationMinutes"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        clientId: fieldErrors.clientId?.[0],
        serviceId: fieldErrors.serviceId?.[0],
        date: fieldErrors.date?.[0],
        time: fieldErrors.time?.[0],
        durationMinutes: fieldErrors.durationMinutes?.[0],
      },
    };
  }

  const { supabase, businessId, business } = await requireBusiness();
  const timezone = business?.timezone ?? "Europe/Madrid";
  const { clientId, serviceId, date, time, durationMinutes, notes } = parsed.data;

  const startsAt = zonedDateTimeToIso(date, time, timezone);
  const endsAt = new Date(
    new Date(startsAt).getTime() + durationMinutes * 60_000,
  ).toISOString();

  // Validación de aplicación para dar feedback amigable de inmediato
  // (SPEC.md sección 20); el EXCLUDE constraint de la BD es la garantía
  // final ante condiciones de carrera, capturada más abajo si esta
  // comprobación no llega a tiempo.
  const { count: overlapCount } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .neq("status", "cancelled")
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt);

  if (overlapCount && overlapCount > 0) {
    return { error: "Ya tienes una cita a esa hora." };
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      business_id: businessId,
      client_id: clientId,
      service_id: serviceId ?? null,
      starts_at: startsAt,
      ends_at: endsAt,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error) {
    if (isOverlapError(error)) {
      return { error: "Ya tienes una cita a esa hora." };
    }
    return { error: "No se pudo crear la cita. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/citas");
  revalidatePath("/dashboard");
  return { success: true, appointmentId: data.id };
}

export async function updateAppointment(
  appointmentId: string,
  _prevState: AppointmentFormState,
  formData: FormData,
): Promise<AppointmentFormState> {
  const parsed = appointmentSchema.safeParse({
    clientId: formData.get("clientId"),
    serviceId: formData.get("serviceId") || undefined,
    date: formData.get("date"),
    time: formData.get("time"),
    durationMinutes: formData.get("durationMinutes"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        clientId: fieldErrors.clientId?.[0],
        serviceId: fieldErrors.serviceId?.[0],
        date: fieldErrors.date?.[0],
        time: fieldErrors.time?.[0],
        durationMinutes: fieldErrors.durationMinutes?.[0],
      },
    };
  }

  const { supabase, businessId, business } = await requireBusiness();
  const timezone = business?.timezone ?? "Europe/Madrid";
  const { clientId, serviceId, date, time, durationMinutes, notes } = parsed.data;

  const startsAt = zonedDateTimeToIso(date, time, timezone);
  const endsAt = new Date(
    new Date(startsAt).getTime() + durationMinutes * 60_000,
  ).toISOString();

  const { count: overlapCount } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .neq("status", "cancelled")
    .neq("id", appointmentId)
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt);

  if (overlapCount && overlapCount > 0) {
    return { error: "Ya tienes una cita a esa hora." };
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      client_id: clientId,
      service_id: serviceId ?? null,
      starts_at: startsAt,
      ends_at: endsAt,
      notes: notes || null,
    })
    .eq("id", appointmentId)
    .eq("business_id", businessId);

  if (error) {
    if (isOverlapError(error)) {
      return { error: "Ya tienes una cita a esa hora." };
    }
    return { error: "No se pudo actualizar la cita. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/citas");
  revalidatePath(`/dashboard/citas/${appointmentId}`);
  revalidatePath("/dashboard");
  return { success: true, appointmentId };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: string,
): Promise<{ error?: string }> {
  const parsedStatus = appointmentStatusSchema.safeParse(status);
  if (!parsedStatus.success) {
    return { error: "Estado no válido." };
  }

  const { supabase, businessId } = await requireBusiness();

  const { error } = await supabase
    .from("appointments")
    .update({ status: parsedStatus.data })
    .eq("id", appointmentId)
    .eq("business_id", businessId);

  if (error) {
    return { error: "No se pudo actualizar el estado de la cita." };
  }

  revalidatePath("/dashboard/citas");
  revalidatePath(`/dashboard/citas/${appointmentId}`);
  revalidatePath("/dashboard");
  return {};
}

export async function cancelAppointment(
  appointmentId: string,
): Promise<{ error?: string }> {
  return updateAppointmentStatus(appointmentId, "cancelled");
}
