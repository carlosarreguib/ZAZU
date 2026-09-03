import { formatInTimeZone } from "date-fns-tz";
import { requireBusiness } from "@/lib/auth/session";
import { formatClientName } from "@/lib/clients/name";
import { NewAppointmentDialog } from "@/components/appointments/new-appointment-dialog";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { AppointmentsCalendar } from "@/components/appointments/appointments-calendar";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DayAppointmentItem } from "@/components/dashboard/day-appointments";

export const metadata = {
  title: "Citas — Zazú",
};

export default async function CitasPage() {
  const { supabase, businessId, business } = await requireBusiness();
  const timezone = business?.timezone ?? "Europe/Madrid";
  const now = new Date();
  // Rango del calendario: 2 meses atrás a 3 meses adelante, suficiente
  // para navegar sin cargar todo el historial (SPEC.md sección 23: el
  // calendario no debe dominar la app ni la performance).
  const calendarStart = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
  const calendarEnd = new Date(now.getFullYear(), now.getMonth() + 4, 0).toISOString();

  const [{ data: upcoming }, { data: calendarAppointments }, { data: clients }, { data: services }, { data: hoursRows }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select(
          "id, starts_at, status, clients(first_name, last_name), services(name, duration_minutes)",
        )
        .eq("business_id", businessId)
        .gte("starts_at", now.toISOString())
        .neq("status", "cancelled")
        .order("starts_at"),
      supabase
        .from("appointments")
        .select(
          "id, starts_at, status, clients(first_name, last_name), services(name, duration_minutes), appointment_reminders(status)",
        )
        .eq("business_id", businessId)
        .gte("starts_at", calendarStart)
        .lte("starts_at", calendarEnd)
        .neq("status", "cancelled")
        .order("starts_at"),
      supabase
        .from("clients")
        .select("id, first_name, last_name, phone")
        .eq("business_id", businessId)
        .order("first_name"),
      supabase
        .from("services")
        .select("id, name, duration_minutes")
        .eq("business_id", businessId)
        .eq("active", true)
        .order("name"),
      supabase
        .from("business_hours")
        .select("day_of_week, is_open, starts_at, ends_at")
        .eq("business_id", businessId),
    ]);

  const clientOptions = (clients ?? []).map((c) => ({
    id: c.id,
    firstName: c.first_name,
    lastName: c.last_name,
    phone: c.phone,
  }));
  const serviceOptions = (services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: s.duration_minutes,
  }));

  const appointmentsByDate: Record<string, DayAppointmentItem[]> = {};
  for (const appt of calendarAppointments ?? []) {
    const dateKey = formatInTimeZone(new Date(appt.starts_at), timezone, "yyyy-MM-dd");
    const item: DayAppointmentItem = {
      id: appt.id,
      startsAt: appt.starts_at,
      clientName: appt.clients
        ? formatClientName(appt.clients.first_name, appt.clients.last_name)
        : "Cliente",
      serviceName: appt.services?.name ?? null,
      durationMinutes: appt.services?.duration_minutes ?? null,
      status: appt.status,
      reminderStatus: appt.appointment_reminders?.[0]?.status ?? null,
    };
    (appointmentsByDate[dateKey] ??= []).push(item);
  }

  const hoursByDayOfWeek: Record<number, { isOpen: boolean; startsAt: string | null; endsAt: string | null }> = {};
  for (const row of hoursRows ?? []) {
    hoursByDayOfWeek[row.day_of_week] = {
      isOpen: row.is_open,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
    };
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Citas</h1>
        <NewAppointmentDialog clients={clientOptions} services={serviceOptions} />
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Próximas citas</TabsTrigger>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {!upcoming || upcoming.length === 0 ? (
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
              {upcoming.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  id={appt.id}
                  startsAt={appt.starts_at}
                  clientName={
                    appt.clients
                      ? formatClientName(appt.clients.first_name, appt.clients.last_name)
                      : "Cliente"
                  }
                  serviceName={appt.services?.name ?? null}
                  durationMinutes={appt.services?.duration_minutes ?? null}
                  status={appt.status}
                  timezone={timezone}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <AppointmentsCalendar
            appointmentsByDate={appointmentsByDate}
            timezone={timezone}
            hoursByDayOfWeek={hoursByDayOfWeek}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
