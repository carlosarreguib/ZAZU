"use server";

import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/auth/session";
import {
  onboardingBusinessSchema,
  onboardingProfileSchema,
  onboardingServiceSchema,
} from "@/lib/validations/onboarding";

export type OnboardingFormState = {
  error?: string;
  fieldErrors?: Partial<
    Record<"businessName" | "contactName" | "serviceName" | "durationMinutes", string>
  >;
};

export async function completeOnboarding(
  _prevState: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const businessParsed = onboardingBusinessSchema.safeParse({
    businessName: formData.get("businessName"),
  });
  const profileParsed = onboardingProfileSchema.safeParse({
    contactName: formData.get("contactName"),
  });
  const serviceParsed = onboardingServiceSchema.safeParse({
    serviceName: formData.get("serviceName"),
    durationMinutes: formData.get("durationMinutes"),
  });

  if (!businessParsed.success || !profileParsed.success || !serviceParsed.success) {
    return {
      fieldErrors: {
        businessName: businessParsed.success
          ? undefined
          : businessParsed.error.flatten().fieldErrors.businessName?.[0],
        contactName: profileParsed.success
          ? undefined
          : profileParsed.error.flatten().fieldErrors.contactName?.[0],
        serviceName: serviceParsed.success
          ? undefined
          : serviceParsed.error.flatten().fieldErrors.serviceName?.[0],
        durationMinutes: serviceParsed.success
          ? undefined
          : serviceParsed.error.flatten().fieldErrors.durationMinutes?.[0],
      },
    };
  }

  const { supabase, user, businessId } = await requireBusiness();
  const { businessName } = businessParsed.data;
  const { contactName } = profileParsed.data;
  const { serviceName, durationMinutes } = serviceParsed.data;

  const { error: businessError } = await supabase
    .from("businesses")
    .update({
      name: businessName,
      contact_name: contactName,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (businessError) {
    return { error: "No se pudo guardar tu negocio. Inténtalo de nuevo." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: contactName })
    .eq("id", user.id);

  if (profileError) {
    return { error: "No se pudo guardar tu perfil. Inténtalo de nuevo." };
  }

  const { error: serviceError } = await supabase.from("services").insert({
    business_id: businessId,
    name: serviceName,
    duration_minutes: durationMinutes,
  });

  if (serviceError) {
    return { error: "No se pudo crear el primer servicio. Inténtalo de nuevo." };
  }

  redirect("/dashboard?onboarded=1");
}
