import { z } from "zod";

export const onboardingBusinessSchema = z.object({
  businessName: z.string().trim().min(1, "Introduce el nombre de tu negocio"),
});

export const onboardingProfileSchema = z.object({
  contactName: z.string().trim().min(1, "Introduce tu nombre"),
});

export const onboardingServiceSchema = z.object({
  serviceName: z.string().trim().min(1, "Introduce el nombre del servicio"),
  durationMinutes: z.coerce
    .number()
    .int("La duración debe ser un número entero")
    .positive("La duración debe ser mayor que 0"),
});
