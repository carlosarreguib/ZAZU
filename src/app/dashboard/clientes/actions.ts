"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/auth/session";
import { normalizeSpanishPhone } from "@/lib/whatsapp/phone";
import { clientSchema } from "@/lib/validations/client";

export type ClientFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"fullName" | "phone" | "notes", string>>;
  duplicateClientId?: string;
};

/**
 * Busca un cliente existente del negocio con el mismo teléfono normalizado
 * (SPEC.md sección 19: evitar duplicados obvios). Devuelve su id si existe.
 */
async function findDuplicateByPhone(
  supabase: Awaited<ReturnType<typeof requireBusiness>>["supabase"],
  businessId: string,
  phone: string,
  excludeClientId?: string,
) {
  const normalized = normalizeSpanishPhone(phone);

  let query = supabase
    .from("clients")
    .select("id, full_name, phone")
    .eq("business_id", businessId);

  if (excludeClientId) {
    query = query.neq("id", excludeClientId);
  }

  const { data: candidates } = await query;

  return candidates?.find(
    (c) => normalizeSpanishPhone(c.phone) === normalized,
  );
}

export async function createClient(
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const parsed = clientSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        fullName: fieldErrors.fullName?.[0],
        phone: fieldErrors.phone?.[0],
        notes: fieldErrors.notes?.[0],
      },
    };
  }

  const { supabase, businessId } = await requireBusiness();
  const { fullName, phone, notes } = parsed.data;

  const forceCreate = formData.get("forceCreate") === "1";

  if (!forceCreate) {
    const duplicate = await findDuplicateByPhone(supabase, businessId, phone);
    if (duplicate) {
      return {
        error: `Ya existe un cliente con ese teléfono: ${duplicate.full_name}.`,
        duplicateClientId: duplicate.id,
      };
    }
  }

  const { error } = await supabase.from("clients").insert({
    business_id: businessId,
    full_name: fullName,
    phone,
    notes: notes || null,
  });

  if (error) {
    return { error: "No se pudo crear el cliente. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/clientes");
  redirect("/dashboard/clientes");
}

export async function updateClient(
  clientId: string,
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const parsed = clientSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        fullName: fieldErrors.fullName?.[0],
        phone: fieldErrors.phone?.[0],
        notes: fieldErrors.notes?.[0],
      },
    };
  }

  const { supabase, businessId } = await requireBusiness();
  const { fullName, phone, notes } = parsed.data;

  const duplicate = await findDuplicateByPhone(
    supabase,
    businessId,
    phone,
    clientId,
  );
  if (duplicate) {
    return {
      error: `Ya existe otro cliente con ese teléfono: ${duplicate.full_name}.`,
      duplicateClientId: duplicate.id,
    };
  }

  const { error } = await supabase
    .from("clients")
    .update({ full_name: fullName, phone, notes: notes || null })
    .eq("id", clientId)
    .eq("business_id", businessId);

  if (error) {
    return { error: "No se pudo actualizar el cliente. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${clientId}`);
  redirect(`/dashboard/clientes/${clientId}`);
}

export type CreateClientInlineResult = {
  error?: string;
  duplicateClientId?: string;
  duplicateClientName?: string;
  clientId?: string;
};

/**
 * Igual que createClient, pero pensada para el flujo "crear cliente durante
 * la cita" (SPEC.md sección 19): devuelve el id en vez de redirigir, para
 * que el formulario de la cita pueda seleccionarlo sin salir del modal.
 */
export async function createClientInline(
  fullName: string,
  phone: string,
  forceCreate = false,
): Promise<CreateClientInlineResult> {
  const parsed = clientSchema.safeParse({ fullName, phone });
  if (!parsed.success) {
    return { error: "Nombre o teléfono no válidos." };
  }

  const { supabase, businessId } = await requireBusiness();

  if (!forceCreate) {
    const duplicate = await findDuplicateByPhone(
      supabase,
      businessId,
      parsed.data.phone,
    );
    if (duplicate) {
      return {
        error: `Ya existe un cliente con ese teléfono: ${duplicate.full_name}.`,
        duplicateClientId: duplicate.id,
        duplicateClientName: duplicate.full_name,
      };
    }
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      business_id: businessId,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "No se pudo crear el cliente. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/clientes");
  return { clientId: data.id };
}

export type DeleteClientResult = { error?: string; success?: boolean };

/**
 * Regla de eliminación (SPEC.md sección 21): si el cliente tiene citas
 * futuras con estado distinto de "cancelled", se bloquea el borrado.
 */
export async function deleteClient(clientId: string): Promise<DeleteClientResult> {
  const { supabase, businessId } = await requireBusiness();

  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("client_id", clientId)
    .neq("status", "cancelled")
    .gte("starts_at", new Date().toISOString());

  if (count && count > 0) {
    return {
      error:
        "Este cliente tiene citas futuras. Cancélalas o reagéndalas antes de eliminarlo.",
    };
  }

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("business_id", businessId);

  if (error) {
    return { error: "No se pudo eliminar el cliente. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/clientes");
  return { success: true };
}
