"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/auth/session";
import {
  businessSettingsSchema,
  reminderTemplateSchema,
} from "@/lib/validations/business";

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
