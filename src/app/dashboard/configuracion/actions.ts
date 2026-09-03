"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/auth/session";
import {
  businessSettingsSchema,
  reminderTemplateSchema,
} from "@/lib/validations/business";
import { businessHoursSchema } from "@/lib/validations/business-hours";

export type BusinessSettingsFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "contactName" | "phone", string>>;
  success?: boolean;
};

export async function updateBusinessSettings(
  _prevState: BusinessSettingsFormState,
  formData: FormData,
): Promise<BusinessSettingsFormState> {
  const parsed = businessSettingsSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName"),
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        name: fieldErrors.name?.[0],
        contactName: fieldErrors.contactName?.[0],
        phone: fieldErrors.phone?.[0],
      },
    };
  }

  const { supabase, businessId } = await requireBusiness();

  const { error } = await supabase
    .from("businesses")
    .update({
      name: parsed.data.name,
      contact_name: parsed.data.contactName,
      phone: parsed.data.phone || null,
    })
    .eq("id", businessId);

  if (error) {
    return { error: "No se pudo guardar el negocio. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/configuracion");
  revalidatePath("/dashboard");
  return { success: true };
}

export type ReminderTemplateFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"template", string>>;
  success?: boolean;
};

export async function updateReminderTemplate(
  _prevState: ReminderTemplateFormState,
  formData: FormData,
): Promise<ReminderTemplateFormState> {
  const parsed = reminderTemplateSchema.safeParse({
    template: formData.get("template"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: { template: parsed.error.flatten().fieldErrors.template?.[0] },
    };
  }

  const { supabase, businessId } = await requireBusiness();

  const { error } = await supabase
    .from("business_settings")
    .update({ default_reminder_template: parsed.data.template })
    .eq("business_id", businessId);

  if (error) {
    return { error: "No se pudo guardar la plantilla. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/configuracion");
  return { success: true };
}

export type BusinessHoursFormState = {
  error?: string;
  fieldErrors?: Record<number, { startsAt?: string; endsAt?: string }>;
  success?: boolean;
};

export async function updateBusinessHours(
  _prevState: BusinessHoursFormState,
  formData: FormData,
): Promise<BusinessHoursFormState> {
  const raw = formData.get("days");
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(String(raw ?? "[]"));
  } catch {
    return { error: "Formato de horario no válido." };
  }

  const parsed = businessHoursSchema.safeParse({ days: parsedJson });

  if (!parsed.success) {
    const fieldErrors: Record<number, { startsAt?: string; endsAt?: string }> = {};
    for (const issue of parsed.error.issues) {
      const dayIndex = issue.path[1];
      const field = issue.path[2];
      if (typeof dayIndex !== "number") continue;
      fieldErrors[dayIndex] ??= {};
      if (field === "startsAt") fieldErrors[dayIndex].startsAt = issue.message;
      if (field === "endsAt") fieldErrors[dayIndex].endsAt = issue.message;
    }
    return { fieldErrors, error: "Revisa los horarios marcados." };
  }

  const { supabase, businessId } = await requireBusiness();

  const rows = parsed.data.days.map((day) => ({
    business_id: businessId,
    day_of_week: day.dayOfWeek,
    is_open: day.isOpen,
    starts_at: day.isOpen ? day.startsAt : null,
    ends_at: day.isOpen ? day.endsAt : null,
  }));

  const { error } = await supabase
    .from("business_hours")
    .upsert(rows, { onConflict: "business_id,day_of_week" });

  if (error) {
    return { error: "No se pudo guardar el horario. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/configuracion");
  revalidatePath("/dashboard/citas");
  return { success: true };
}
