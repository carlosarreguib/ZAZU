import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/dates/format";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/validations/appointment";

export type DayAppointmentItem = {
  id: string;
  startsAt: string;
  clientName: string;
  serviceName: string | null;
  durationMinutes: number | null;
  status: string;
  reminderStatus: string | null;
};

export function DayAppointments({
  appointments,
  timezone,
  emptyMessage,
}: {
  appointments: DayAppointmentItem[];
  timezone: string;
  emptyMessage: string;
}) {
  if (appointments.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {appointments.map((appt) => (
        <li
          key={appt.id}
          className="flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-semibold tabular-nums">
              {formatTime(appt.startsAt, timezone)}
            </span>
            <div>
              <Link
                href={`/dashboard/citas/${appt.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {appt.clientName}
              </Link>
              <p className="text-sm text-muted-foreground">
                {appt.serviceName ?? "Sin servicio"}
                {appt.durationMinutes ? ` · ${appt.durationMinutes} min` : ""}
                {" · "}
                {APPOINTMENT_STATUS_LABELS[appt.status] ?? appt.status}
              </p>
            </div>
          </div>

          <div>
            {appt.reminderStatus === "sent" ? (
              <span className="text-sm font-medium text-primary">
                ✓ Recordatorio enviado
              </span>
            ) : (
              <Button variant="outline" size="sm" disabled title="Disponible en la Fase 9">
                Recordar por WhatsApp
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
