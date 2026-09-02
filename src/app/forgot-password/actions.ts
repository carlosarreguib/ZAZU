"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export type ForgotPasswordFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"email", string>>;
  success?: boolean;
};

export async function requestPasswordReset(
  _prevState: ForgotPasswordFormState,
  formData: FormData,
): Promise<ForgotPasswordFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: { email: parsed.error.flatten().fieldErrors.email?.[0] },
    };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${origin}/auth/callback?redirectTo=/reset-password` },
  );

  // No revelamos si el email existe o no (evita enumeración de cuentas):
  // siempre respondemos éxito salvo error de infraestructura.
  if (error) {
    return { error: "No se pudo procesar la solicitud. Inténtalo de nuevo." };
  }

  return { success: true };
}
