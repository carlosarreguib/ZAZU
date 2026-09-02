import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Devuelve el usuario autenticado o redirige a /login. Úsalo en Server
 * Components y Server Actions que requieran sesión — el proxy ya protege
 * /dashboard, pero las Server Actions deben comprobar auth por sí mismas
 * (SPEC.md sección 33).
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

/**
 * Devuelve el negocio activo del usuario autenticado (el MVP asume un único
 * negocio por usuario, SPEC.md sección 5.1) o redirige a /login si no hay
 * sesión o el usuario no pertenece a ningún negocio.
 */
export async function requireBusiness() {
  const { supabase, user } = await requireUser();

  const { data: membership, error: membershipError } = await supabase
    .from("business_members")
    .select("business_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    redirect("/login");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, contact_name, phone, timezone, onboarding_completed_at")
    .eq("id", membership.business_id)
    .single();

  if (businessError || !business) {
    redirect("/login");
  }

  return {
    supabase,
    user,
    businessId: membership.business_id,
    role: membership.role,
    business,
  };
}
