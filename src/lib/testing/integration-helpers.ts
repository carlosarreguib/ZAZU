import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Helpers exclusivos para tests de integración (*.integration.test.ts).
 * No importar desde código de aplicación.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta ${name} en el entorno. Los tests de integración necesitan .env.local con las credenciales de Supabase.`,
    );
  }
  return value;
}

export function createAdminTestClient(): SupabaseClient<Database> {
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/**
 * Crea un usuario de prueba real vía Admin API (con email ya confirmado) y
 * devuelve un cliente autenticado como ese usuario (respeta RLS de verdad).
 */
export async function createTestUser(emailPrefix: string) {
  const admin = createAdminTestClient();
  const email = `${emailPrefix}+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = "TestPassword123!";

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    throw new Error(`No se pudo crear usuario de prueba: ${createError?.message}`);
  }

  const anon = createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { error: signInError } = await anon.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    throw new Error(`No se pudo iniciar sesión con el usuario de prueba: ${signInError.message}`);
  }

  return { userId: created.user.id, email, client: anon, admin };
}

/**
 * Provisiona negocio + membership + settings para un usuario de prueba ya
 * autenticado, usando la misma función RPC que usa el registro real.
 */
export async function provisionTestBusiness(
  client: SupabaseClient<Database>,
  businessName: string,
) {
  const { data, error } = await client.rpc("provision_business_for_current_user", {
    business_name: businessName,
    contact_name: "Test Owner",
  });
  if (error || !data) {
    throw new Error(`No se pudo provisionar negocio de prueba: ${error?.message}`);
  }
  return data as string;
}

/** Borra completamente un usuario de prueba y sus datos asociados (cascada). */
export async function cleanupTestUser(admin: SupabaseClient<Database>, userId: string) {
  const { data: membership } = await admin
    .from("business_members")
    .select("business_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (membership) {
    await admin.from("businesses").delete().eq("id", membership.business_id);
  }
  await admin.from("profiles").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);
}
