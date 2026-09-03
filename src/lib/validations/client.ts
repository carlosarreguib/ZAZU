import { z } from "zod";

export const clientSchema = z.object({
  firstName: z.string().trim().min(1, "Introduce el nombre del cliente"),
  lastName: z.string().trim().max(200, "El apellido es demasiado largo").optional(),
  phone: z.string().trim().min(1, "Introduce el teléfono del cliente"),
  notes: z.string().trim().max(2000, "Las notas son demasiado largas").optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
