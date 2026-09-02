import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { requireBusiness } from "@/lib/auth/session";
import { formatDateLong, formatTime } from "@/lib/dates/format";
import { EditAppointmentDialog } from "@/components/appointments/edit-appointment-dialog";
import { AppointmentStatusSelect } from "@/components/appointments/appointment-status-select";

export default async function CitaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, businessId, business } = await requireBusiness();
  const timezone = business?.timezone ?? "Europe/Madrid";

  const { data: appointment } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, notes, client_id, service_id, clients(id, full_name, phone), services(id, name, duration_minutes)",
    )
    .eq("id", id)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!appointment) {
    notFound();
  }

  const [{ data: clients }, { data: services }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, full_name, phone")
      .eq("business_id", businessId)
      .order("full_name"),
    supabase
      .from("services")
      .select("id, name, duration_minutes")
      .eq("business_id", businessId)
      .eq("active", true)
      .order("name"),
  ]);

  const durationMinutes = Math.round(
    (new Date(appointment.ends_at).getTime() -
      new Date(appointment.starts_at).getTime()) /
      60_000,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {appointment.clients?.full_name ?? "Cliente"}
          </h1>
          <p className="text-muted-foreground">
            {formatDateLong(appointment.starts_at, timezone)} ·{" "}
            {formatTime(appointment.starts_at, timezone)} · {durationMinutes} min
          </p>
          <p className="text-muted-foreground">
            {appointment.services?.name ?? "Sin servicio"}
          </p>
          {appointment.notes ? (
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              {appointment.notes}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <AppointmentStatusSelect
            appointmentId={appointment.id}
            status={appointment.status}
          />
          <EditAppointmentDialog
            appointmentId={appointment.id}
            clients={(clients ?? []).map((c) => ({
              id: c.id,
              fullName: c.full_name,
              phone: c.phone,
            }))}
            services={(services ?? []).map((s) => ({
              id: s.id,
              name: s.name,
              durationMinutes: s.duration_minutes,
            }))}
            defaultValues={{
              clientId: appointment.client_id,
              serviceId: appointment.service_id ?? undefined,
              date: formatInTimeZone(
                new Date(appointment.starts_at),
                timezone,
                "yyyy-MM-dd",
              ),
              time: formatInTimeZone(
                new Date(appointment.starts_at),
                timezone,
                "HH:mm",
              ),
              durationMinutes,
              notes: appointment.notes,
            }}
          />
        </div>
      </div>
    </div>
  );
}
