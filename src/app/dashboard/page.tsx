import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewAppointmentDialog } from "@/components/appointments/new-appointment-dialog";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { DayAppointments, type DayAppointmentItem } from "@/components/dashboard/day-appointments";
import { ReminderFlow } from "@/components/whatsapp/reminder-flow";
import { requireBusiness } from "@/lib/auth/session";
import { dayRangeUtc } from "@/lib/dates/ranges";
import { formatDateLong } from "@/lib/dates/format";

async function loadDayAppointments(
  supabase: Awaited<ReturnType<typeof requireBusiness>>["supabase"],
  businessId: string,
  startIso: string,
  endIso: string,
): Promise<DayAppointmentItem[]> {
  const { data } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, status, clients(full_name), services(name, duration_minutes), appointment_reminders(status)",
    )
    .eq("business_id", businessId)
    .gte("starts_at", startIso)
    .lte("starts_at", endIso)
    .neq("status", "cancelled")
    .order("starts_at");

  return (data ?? []).map((appt) => ({
    id: appt.id,
    startsAt: appt.starts_at,
    clientName: appt.clients?.full_name ?? "Cliente",
    serviceName: appt.services?.name ?? null,
    durationMinutes: appt.services?.duration_minutes ?? null,
    status: appt.status,
    reminderStatus: appt.appointment_reminders?.[0]?.status ?? null,
  }));
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarded?: string }>;
}) {
  const { onboarded } = await searchParams;
  const { supabase, businessId, business } = await requireBusiness();
  const timezone = business?.timezone ?? "Europe/Madrid";

  const today = dayRangeUtc(timezone, 0);
  const tomorrow = dayRangeUtc(timezone, 1);

  const [todayAppointments, tomorrowAppointments] = await Promise.all([
    loadDayAppointments(supabase, businessId, today.startIso, today.endIso),
    loadDayAppointments(supabase, businessId, tomorrow.startIso, tomorrow.endIso),
  ]);

  const pendingReminders = [...todayAppointments, ...tomorrowAppointments].filter(
    (a) => a.reminderStatus !== "sent",
  ).length;

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
      {onboarded ? (
        <p className="text-sm font-medium text-primary">Tu agenda está lista.</p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <NewAppointmentDialog clients={clientOptions} services={serviceOptions} />
      </div>

      <DashboardSummary
        todayCount={todayAppointments.length}
        tomorrowCount={tomorrowAppointments.length}
        pendingReminders={pendingReminders}
      />

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Hoy</TabsTrigger>
          <TabsTrigger value="tomorrow">Mañana</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {formatDateLong(today.startIso, timezone)}
          </h2>
          <DayAppointments
            appointments={todayAppointments}
            timezone={timezone}
            emptyMessage="Hoy no tienes ninguna cita."
          />
        </TabsContent>

        <TabsContent value="tomorrow" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              {formatDateLong(tomorrow.startIso, timezone)}
            </h2>
            {tomorrowAppointments.length > 0 ? (
              <ReminderFlow
                items={tomorrowAppointments
                  .filter((a) => a.reminderStatus !== "sent")
                  .map((a) => ({
                    id: a.id,
                    startsAt: a.startsAt,
                    clientName: a.clientName,
                    serviceName: a.serviceName,
                  }))}
                timezone={timezone}
              />
            ) : null}
          </div>
          <DayAppointments
            appointments={tomorrowAppointments}
            timezone={timezone}
            emptyMessage="No tienes citas mañana."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
