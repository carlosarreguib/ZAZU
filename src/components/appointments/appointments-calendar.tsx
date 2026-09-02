"use client";

import { useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Calendar } from "@/components/ui/calendar";
import { DayAppointments, type DayAppointmentItem } from "@/components/dashboard/day-appointments";
import { formatDateLong } from "@/lib/dates/format";
import { es } from "date-fns/locale";

export function AppointmentsCalendar({
  appointmentsByDate,
  timezone,
}: {
  appointmentsByDate: Record<string, DayAppointmentItem[]>;
  timezone: string;
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

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
      <Calendar
        mode="single"
        locale={es}
        selected={selected}
        onSelect={(date) => date && setSelected(date)}
        modifiers={{ hasAppointments: daysWithAppointments }}
        modifiersClassNames={{ hasAppointments: "font-bold underline" }}
      />
      <div className="flex flex-1 flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {selectedDateStr === todayStr
            ? "Hoy"
            : formatDateLong(`${selectedDateStr}T12:00:00Z`, "UTC")}
        </h2>
        <DayAppointments
          appointments={appointmentsByDate[selectedDateStr] ?? []}
          timezone={timezone}
          emptyMessage="No hay citas ese día."
        />
      </div>
    </div>
  );
}
