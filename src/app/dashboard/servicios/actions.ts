"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/auth/session";
import { serviceSchema } from "@/lib/validations/service";

export type ServiceFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "durationMinutes", string>>;
  success?: boolean;
};

export async function createService(
  _prevState: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    durationMinutes: formData.get("durationMinutes"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        name: fieldErrors.name?.[0],
        durationMinutes: fieldErrors.durationMinutes?.[0],
      },
    };
  }

  const { supabase, businessId } = await requireBusiness();

  const { error } = await supabase.from("services").insert({
    business_id: businessId,
    name: parsed.data.name,
    duration_minutes: parsed.data.durationMinutes,
  });

  if (error) {
    return { error: "No se pudo crear el servicio. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/servicios");
  return { success: true };
}

export async function updateService(
  serviceId: string,
  _prevState: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    durationMinutes: formData.get("durationMinutes"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        name: fieldErrors.name?.[0],
        durationMinutes: fieldErrors.durationMinutes?.[0],
      },
    };
  }

  const { supabase, businessId } = await requireBusiness();

  const { error } = await supabase
    .from("services")
    .update({
      name: parsed.data.name,
      duration_minutes: parsed.data.durationMinutes,
    })
    .eq("id", serviceId)
    .eq("business_id", businessId);

  if (error) {
    return { error: "No se pudo actualizar el servicio. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/servicios");
  return { success: true };
}

export async function toggleServiceActive(
  serviceId: string,
  active: boolean,
): Promise<{ error?: string }> {
  const { supabase, businessId } = await requireBusiness();

  const { error } = await supabase
    .from("services")
    .update({ active })
    .eq("id", serviceId)
    .eq("business_id", businessId);

  if (error) {
    return { error: "No se pudo actualizar el servicio. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/servicios");
  return {};
}
