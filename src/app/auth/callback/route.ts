import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Intercambia el código de la URL (confirmación de email / recuperación de
 * contraseña) por una sesión. Requerido por Supabase Auth (SPEC.md sección 9).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
