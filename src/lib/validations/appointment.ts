import { z } from "zod";

/**
 * Mapeo UI (español) <-> valor en BD (inglés), SPEC.md sección 6. En el MVP
 * la UI solo ofrece estos tres; "completed" y "no_show" existen en el
 * esquema para V2 pero no tienen UI dedicada.
 */
export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  scheduled: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No presentado",
};

export const MVP_APPOINTMENT_STATUSES = [
  "scheduled",
  "confirmed",
  "cancelled",
] as const;

export const newClientForAppointmentSchema = z.object({
  firstName: z.string().trim().min(1, "Introduce el nombre del cliente"),
  lastName: z.string().trim().optional(),
  phone: z.string().trim().min(1, "Introduce el teléfono del cliente"),
});

export const appointmentSchema = z.object({
  clientId: z.string().uuid("Selecciona un cliente"),
  serviceId: z.string().uuid("Selecciona un servicio").optional(),
  date: z.string().min(1, "Selecciona una fecha"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Selecciona una hora"),
  durationMinutes: z.coerce
    .number()
    .int()
    .positive("La duración debe ser mayor que 0"),
  notes: z.string().trim().max(2000).optional(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

export const appointmentStatusSchema = z.enum([
  "scheduled",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);
