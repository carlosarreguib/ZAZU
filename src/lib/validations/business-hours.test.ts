import { describe, expect, it } from "vitest";
import { businessHoursSchema } from "./business-hours";

function dayInput(overrides: Partial<{ dayOfWeek: number; isOpen: boolean; startsAt: string; endsAt: string }> = {}) {
  return {
    dayOfWeek: 1,
    isOpen: true,
    startsAt: "09:00",
    endsAt: "18:00",
    ...overrides,
  };
}

describe("businessHoursSchema", () => {
  it("acepta 7 días abiertos con horas válidas", () => {
    const days = Array.from({ length: 7 }, (_, i) => dayInput({ dayOfWeek: i }));
    const result = businessHoursSchema.safeParse({ days });
    expect(result.success).toBe(true);
  });

  it("acepta un día cerrado sin horas", () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      i === 0
        ? { dayOfWeek: 0, isOpen: false, startsAt: "", endsAt: "" }
        : dayInput({ dayOfWeek: i }),
    );
    const result = businessHoursSchema.safeParse({ days });
    expect(result.success).toBe(true);
  });

  it("rechaza un día abierto sin hora de inicio", () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      i === 0 ? dayInput({ dayOfWeek: 0, startsAt: "" }) : dayInput({ dayOfWeek: i }),
    );
    const result = businessHoursSchema.safeParse({ days });
    expect(result.success).toBe(false);
  });

  it("rechaza un día abierto donde la hora de fin no es posterior a la de inicio", () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      i === 0
        ? dayInput({ dayOfWeek: 0, startsAt: "18:00", endsAt: "09:00" })
        : dayInput({ dayOfWeek: i }),
    );
    const result = businessHoursSchema.safeParse({ days });
    expect(result.success).toBe(false);
  });

  it("rechaza horas de fin iguales a las de inicio", () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      i === 0
        ? dayInput({ dayOfWeek: 0, startsAt: "09:00", endsAt: "09:00" })
        : dayInput({ dayOfWeek: i }),
    );
    const result = businessHoursSchema.safeParse({ days });
    expect(result.success).toBe(false);
  });

  it("rechaza si no vienen exactamente 7 días", () => {
    const days = Array.from({ length: 6 }, (_, i) => dayInput({ dayOfWeek: i }));
    const result = businessHoursSchema.safeParse({ days });
    expect(result.success).toBe(false);
  });
});
