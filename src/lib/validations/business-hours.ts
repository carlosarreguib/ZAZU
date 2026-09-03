import { z } from "zod";

const dayHoursSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isOpen: z.boolean(),
    startsAt: z.string().trim(),
    endsAt: z.string().trim(),
  })
  .superRefine((day, ctx) => {
    if (!day.isOpen) return;

    if (!day.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startsAt"],
        message: "Indica la hora de inicio",
      });
    }
    if (!day.endsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "Indica la hora de fin",
      });
    }
    if (day.startsAt && day.endsAt && day.endsAt <= day.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "La hora de fin debe ser posterior a la de inicio",
      });
    }
  });

export const businessHoursSchema = z.object({
  days: z.array(dayHoursSchema).length(7, "Faltan días de la semana"),
});

export type DayHoursInput = z.infer<typeof dayHoursSchema>;
export type BusinessHoursInput = z.infer<typeof businessHoursSchema>;
