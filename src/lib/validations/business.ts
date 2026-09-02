import { z } from "zod";

export const businessSettingsSchema = z.object({
  name: z.string().trim().min(1, "Introduce el nombre del negocio"),
  contactName: z.string().trim().min(1, "Introduce el nombre de contacto"),
  phone: z.string().trim().max(30).optional(),
});

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;

export const reminderTemplateSchema = z.object({
  template: z.string().trim().min(1, "La plantilla no puede estar vacía"),
});

export type ReminderTemplateInput = z.infer<typeof reminderTemplateSchema>;
