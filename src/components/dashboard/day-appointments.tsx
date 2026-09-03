import { AppointmentListItem } from "@/components/appointments/appointment-list-item";

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
        <AppointmentListItem key={appt.id} appointment={appt} timezone={timezone} />
      ))}
    </ul>
  );
}
