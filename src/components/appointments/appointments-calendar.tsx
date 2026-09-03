"use client";

import { useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Calendar } from "@/components/ui/calendar";
import { DayAvailability } from "@/components/appointments/day-availability";
import type { DayAppointmentItem } from "@/components/dashboard/day-appointments";
import { computeDayAvailability } from "@/lib/scheduling/availability";
import { formatDateLong } from "@/lib/dates/format";
import { es } from "date-fns/locale";

type DayHours = { isOpen: boolean; startsAt: string | null; endsAt: string | null };

export function AppointmentsCalendar({
  appointmentsByDate,
  timezone,
  hoursByDayOfWeek,
}: {
  appointmentsByDate: Record<string, DayAppointmentItem[]>;
  timezone: string;
  hoursByDayOfWeek: Record<number, DayHours>;
}) {
  const todayStr = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
  const [selected, setSelected] = useState<Date>(new Date());
  const selectedDateStr = formatInTimeZone(selected, timezone, "yyyy-MM-dd");
  const daysWithAppointments = useMemo(
    () =>
      Object.keys(appointmentsByDate)
        .filter((d) => appointmentsByDate[d].length > 0)
        .map((d) => new Date(`${d}T12:00:00`)),
    [appointmentsByDate],
  );

  const selectedDayOfWeek = new Date(`${selectedDateStr}T12:00:00Z`).getUTCDay();
  const selectedDayHours = hoursByDayOfWeek[selectedDayOfWeek] ?? null;

  const availabilityBlocks = useMemo(
    () =>
      computeDayAvailability({
        dateStr: selectedDateStr,
        timezone,
        hours: selectedDayHours,
        appointments: appointmentsByDate[selectedDateStr] ?? [],
      }),
    [selectedDateStr, timezone, selectedDayHours, appointmentsByDate],
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
      <Calendar
        mode="single"
        locale={es}
        selected={selected}
        onSelect={(date) => date && setSelected(date)}
        modifiers={{ hasAppointments: daysWithAppointments }}
        modifiersClassNames={{ hasAppointments: "font-bold underline" }}
        className="w-full sm:w-auto sm:shrink-0 sm:basis-1/4 [--cell-size:--spacing(11)]"
        classNames={{ root: "w-full", month: "w-full" }}
      />
      <div className="flex flex-1 flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {selectedDateStr === todayStr
            ? "Hoy"
            : formatDateLong(`${selectedDateStr}T12:00:00Z`, "UTC")}
        </h2>
        <DayAvailability
          blocks={availabilityBlocks}
          timezone={timezone}
          closedMessage={
            selectedDayHours?.isOpen === false
              ? "Cerrado este día."
              : "No hay horario configurado para este día."
          }
        />
      </div>
    </div>
  );
}
