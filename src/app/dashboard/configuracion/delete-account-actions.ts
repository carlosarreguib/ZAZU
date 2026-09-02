"use server";

import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export type DeleteAccountResult = { error?: string };

/**
 * Elimina la cuenta del usuario (SPEC.md sección 25). En el MVP cada
 * usuario es owner único de su negocio, así que borrar el usuario de
 * auth.users hace caer en cascada (ON DELETE CASCADE) profile,
 * business_members, y por transitividad — vía las FKs de businesses hacia
 * business_members — el negocio no se borra automáticamente solo con esto:
 * se borra explícitamente aquí también el negocio, lo que arrastra en
 * cascada clients, services, appointments, appointment_reminders y
 * business_settings.
 *
 * Requiere la Admin API (service role key), ejecutada solo server-side.
 */
export async function deleteAccount(): Promise<DeleteAccountResult> {
  const { supabase, user, businessId, role } = await requireBusiness();

  if (role !== "owner") {
    return {
      error:
        "Solo el propietario del negocio puede eliminar la cuenta y sus datos.",
    };
  }

  // Borra el negocio explícitamente (cascada a clients, services,
  // appointments, appointment_reminders, business_settings,
  // business_members) antes de borrar el usuario de auth.
  const { error: businessError } = await supabase
    .from("businesses")
    .delete()
    .eq("id", businessId);

  if (businessError) {
    return {
      error: "No se pudo eliminar el negocio. Inténtalo de nuevo.",
    };
  }

  const admin = createAdminClient();
  const { error: authError } = await admin.auth.admin.deleteUser(user.id);

  if (authError) {
    return {
      error:
        "Se eliminaron tus datos pero no se pudo eliminar la cuenta de acceso. Contacta con soporte.",
    };
  }

  await supabase.auth.signOut();
  redirect("/");
}
