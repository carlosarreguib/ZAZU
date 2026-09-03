import Link from "next/link";
import { formatTime } from "@/lib/dates/format";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/validations/appointment";
import { WhatsAppReminderButton } from "@/components/whatsapp/whatsapp-reminder-button";
import type { DayAppointmentItem } from "@/components/dashboard/day-appointments";

export function AppointmentListItem({
  appointment,
  timezone,
}: {
  appointment: DayAppointmentItem;
  timezone: string;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-baseline gap-3">
        <span className="text-lg font-semibold tabular-nums">
          {formatTime(appointment.startsAt, timezone)}
        </span>
        <div>
          <Link
            href={`/dashboard/citas/${appointment.id}`}
            className="font-medium underline-offset-4 hover:underline"
          >
            {appointment.clientName}
          </Link>
          <p className="text-sm text-muted-foreground">
            {appointment.serviceName ?? "Sin servicio"}
            {appointment.durationMinutes ? ` · ${appointment.durationMinutes} min` : ""}
            {" · "}
            {APPOINTMENT_STATUS_LABELS[appointment.status] ?? appointment.status}
          </p>
        </div>
      </div>

      <WhatsAppReminderButton
        appointmentId={appointment.id}
        alreadySent={appointment.reminderStatus === "sent"}
      />
    </li>
  );
}
