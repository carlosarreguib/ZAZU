"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  updateBusinessHours,
  type BusinessHoursFormState,
} from "@/app/dashboard/configuracion/actions";

const initialState: BusinessHoursFormState = {};

const DAY_LABELS: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  0: "Domingo",
};

// Orden de visualización fijo lunes→domingo, independiente de week_starts_on.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export type DayHoursValue = {
  dayOfWeek: number;
  isOpen: boolean;
  startsAt: string;
  endsAt: string;
};

export function WorkingHoursForm({
  defaultDays,
}: {
  defaultDays: DayHoursValue[];
}) {
  const [state, formAction, isPending] = useActionState(
    updateBusinessHours,
    initialState,
  );
  const [days, setDays] = useState<DayHoursValue[]>(defaultDays);

  function updateDay(dayOfWeek: number, patch: Partial<DayHoursValue>) {
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)),
    );
  }

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <input type="hidden" name="days" value={JSON.stringify(days)} />

      <div className="flex flex-col gap-3">
        {DISPLAY_ORDER.map((dayOfWeek) => {
          const day = days.find((d) => d.dayOfWeek === dayOfWeek);
          if (!day) return null;
          const dayErrors = state.fieldErrors?.[dayOfWeek];

          return (
            <div
              key={dayOfWeek}
              className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex items-center gap-2 sm:w-32">
                <Switch
                  checked={day.isOpen}
                  onCheckedChange={(checked) =>
                    updateDay(dayOfWeek, { isOpen: checked })
                  }
                  aria-label={`${DAY_LABELS[dayOfWeek]} ${day.isOpen ? "abierto" : "cerrado"}`}
                />
                <span className="text-sm font-medium">{DAY_LABELS[dayOfWeek]}</span>
              </div>

              {day.isOpen ? (
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start">
                  <div className="flex flex-1 flex-col gap-1">
                    <Label htmlFor={`starts-${dayOfWeek}`} className="sr-only">
                      Hora de inicio, {DAY_LABELS[dayOfWeek]}
                    </Label>
                    <Input
                      id={`starts-${dayOfWeek}`}
                      type="time"
                      value={day.startsAt}
                      onChange={(e) =>
                        updateDay(dayOfWeek, { startsAt: e.target.value })
                      }
                      aria-invalid={Boolean(dayErrors?.startsAt)}
                    />
                    {dayErrors?.startsAt ? (
                      <p className="text-xs text-destructive">{dayErrors.startsAt}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <Label htmlFor={`ends-${dayOfWeek}`} className="sr-only">
                      Hora de fin, {DAY_LABELS[dayOfWeek]}
                    </Label>
                    <Input
                      id={`ends-${dayOfWeek}`}
                      type="time"
                      value={day.endsAt}
                      onChange={(e) =>
                        updateDay(dayOfWeek, { endsAt: e.target.value })
                      }
                      aria-invalid={Boolean(dayErrors?.endsAt)}
                    />
                    {dayErrors?.endsAt ? (
                      <p className="text-xs text-destructive">{dayErrors.endsAt}</p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="flex-1 text-sm text-muted-foreground">Cerrado</p>
              )}
            </div>
          );
        })}
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-primary">Horario guardado correctamente.</p>
      ) : null}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Guardando..." : "Guardar horario"}
      </Button>
    </form>
  );
}
