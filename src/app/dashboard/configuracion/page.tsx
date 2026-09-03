import { requireBusiness } from "@/lib/auth/session";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BusinessSettingsForm } from "@/components/settings/business-settings-form";
import { ReminderTemplateForm } from "@/components/settings/reminder-template-form";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import { WorkingHoursForm, type DayHoursValue } from "@/components/settings/working-hours-form";

export const metadata = {
  title: "Configuración — Zazú",
};

const DEFAULT_TEMPLATE =
  "Hola {{client_name}}, te recordamos tu cita de {{service}} mañana a las {{time}} en {{business_name}}. ¡Te esperamos!";

export default async function ConfiguracionPage() {
  const { supabase, user, businessId, business } = await requireBusiness();

  const { data: settings } = await supabase
    .from("business_settings")
    .select("default_reminder_template")
    .eq("business_id", businessId)
    .maybeSingle();

  const { data: hoursRows } = await supabase
    .from("business_hours")
    .select("day_of_week, is_open, starts_at, ends_at")
    .eq("business_id", businessId);

  const defaultDays: DayHoursValue[] = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const row = hoursRows?.find((r) => r.day_of_week === dayOfWeek);
    return {
      dayOfWeek,
      isOpen: row?.is_open ?? false,
      startsAt: row?.starts_at?.slice(0, 5) ?? "",
      endsAt: row?.ends_at?.slice(0, 5) ?? "",
    };
  });

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <h1 className="text-2xl font-semibold">Configuración</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Negocio</h2>
        <BusinessSettingsForm
          defaultValues={{
            name: business?.name ?? "",
            contactName: business?.contact_name ?? "",
            phone: business?.phone ?? null,
          }}
        />
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Horario laboral</h2>
        <WorkingHoursForm defaultDays={defaultDays} />
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Recordatorios</h2>
        <ReminderTemplateForm
          defaultTemplate={settings?.default_reminder_template ?? DEFAULT_TEMPLATE}
        />
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Cuenta</h2>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <div className="flex flex-col items-start gap-3">
          <form action={logout}>
            <Button type="submit" variant="outline">
              Cerrar sesión
            </Button>
          </form>
          <DeleteAccountButton />
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Suscripción</h2>
        <p className="text-sm text-muted-foreground">Próximamente.</p>
      </section>
    </div>
  );
}
