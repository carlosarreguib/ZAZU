import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().trim().min(1, "Introduce el nombre del servicio"),
  durationMinutes: z.coerce
    .number()
    .int("La duración debe ser un número entero")
    .positive("La duración debe ser mayor que 0"),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
