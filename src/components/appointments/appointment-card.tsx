import Link from "next/link";
import { formatDateTime } from "@/lib/dates/format";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/validations/appointment";

export function AppointmentCard({
  id,
  startsAt,
  clientName,
  serviceName,
  durationMinutes,
  status,
  timezone,
}: {
  id: string;
  startsAt: string;
  clientName: string;
  serviceName: string | null;
  durationMinutes: number | null;
  status: string;
  timezone: string;
}) {
  return (
    <Link
      href={`/dashboard/citas/${id}`}
      className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 hover:bg-accent/50"
    >
      <div>
        <p className="font-medium">{clientName}</p>
        <p className="text-sm text-muted-foreground">
          {serviceName ?? "Sin servicio"}
          {durationMinutes ? ` · ${durationMinutes} min` : ""}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 text-sm">
        <span>{formatDateTime(startsAt, timezone)}</span>
        <span className="text-muted-foreground">
          {APPOINTMENT_STATUS_LABELS[status] ?? status}
        </span>
      </div>
    </Link>
  );
}
