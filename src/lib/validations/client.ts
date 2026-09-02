import { z } from "zod";

export const clientSchema = z.object({
  fullName: z.string().trim().min(1, "Introduce el nombre del cliente"),
  phone: z.string().trim().min(1, "Introduce el teléfono del cliente"),
  notes: z.string().trim().max(2000, "Las notas son demasiado largas").optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
