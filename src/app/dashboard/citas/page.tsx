import { requireBusiness } from "@/lib/auth/session";
import { NewAppointmentDialog } from "@/components/appointments/new-appointment-dialog";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { EmptyState } from "@/components/dashboard/empty-state";

export const metadata = {
  title: "Citas — Zazú",
};

export default async function CitasPage() {
  const { supabase, businessId, business } = await requireBusiness();
  const timezone = business?.timezone ?? "Europe/Madrid";

  const [{ data: appointments }, { data: clients }, { data: services }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select(
          "id, starts_at, status, clients(full_name), services(name, duration_minutes)",
        )
        .eq("business_id", businessId)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at"),
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

  const clientOptions = (clients ?? []).map((c) => ({
    id: c.id,
    fullName: c.full_name,
    phone: c.phone,
  }));
  const serviceOptions = (services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: s.duration_minutes,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Citas</h1>
        <NewAppointmentDialog clients={clientOptions} services={serviceOptions} />
      </div>

      {!appointments || appointments.length === 0 ? (
        <EmptyState
          title="No tienes próximas citas."
          action={
            <NewAppointmentDialog
              clients={clientOptions}
              services={serviceOptions}
              label="Agendar una cita"
            />
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {appointments.map((appt) => (
            <AppointmentCard
              key={appt.id}
              id={appt.id}
              startsAt={appt.starts_at}
              clientName={appt.clients?.full_name ?? "Cliente"}
              serviceName={appt.services?.name ?? null}
              durationMinutes={appt.services?.duration_minutes ?? null}
              status={appt.status}
              timezone={timezone}
            />
          ))}
        </div>
      )}
    </div>
  );
}
