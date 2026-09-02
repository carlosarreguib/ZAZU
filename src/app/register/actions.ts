"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations/auth";

export type RegisterFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"fullName" | "email" | "password", string>>;
};

export async function register(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        fullName: fieldErrors.fullName?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      },
    };
  }

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (signUpError) {
    console.error("[register] signUp failed:", signUpError.code);
    if (signUpError.code === "user_already_exists") {
      return { error: "Ya existe una cuenta con ese email." };
    }
    return { error: "No se pudo crear la cuenta. Inténtalo de nuevo." };
  }

  // Sin confirmación de email requerida, signUp ya deja sesión activa.
  if (!signUpData.session) {
    redirect("/login?registered=1");
  }

  // Crea profile + business + business_member(owner) + business_settings de
  // forma atómica (SPEC.md sección 9). El nombre del negocio se completa en
  // el onboarding (Fase 4); aquí usamos un nombre provisional derivado del
  // nombre del profesional para que el negocio exista desde el primer login.
  const { error: provisionError } = await supabase.rpc(
    "provision_business_for_current_user",
    {
      business_name: `Negocio de ${fullName}`,
      contact_name: fullName,
    },
  );

  if (provisionError) {
    return {
      error:
        "Tu cuenta se creó pero no pudimos preparar tu negocio. Contacta con soporte.",
    };
  }

  // El onboarding (SPEC.md sección 10) se implementa en la Fase 4. Hasta
  // entonces, el usuario recién registrado entra directo al dashboard con el
  // negocio ya provisionado.
  redirect("/dashboard");
}
