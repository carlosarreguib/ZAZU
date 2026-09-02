import { requireBusiness } from "@/lib/auth/session";
import { NewServiceDialog } from "@/components/services/new-service-dialog";
import { EditServiceDialog } from "@/components/services/edit-service-dialog";
import { ServiceActiveToggle } from "@/components/services/service-active-toggle";
import { EmptyState } from "@/components/dashboard/empty-state";

export const metadata = {
  title: "Servicios — Zazú",
};

export default async function ServiciosPage() {
  const { supabase, businessId } = await requireBusiness();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_minutes, active")
    .eq("business_id", businessId)
    .order("name");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Servicios</h1>
        <NewServiceDialog />
      </div>

      {!services || services.length === 0 ? (
        <EmptyState
          title="Todavía no tienes servicios."
          action={<NewServiceDialog label="Añadir primer servicio" />}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {services.map((service) => (
            <li
              key={service.id}
              className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
            >
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted-foreground">
                  {service.duration_minutes} min
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ServiceActiveToggle
                  serviceId={service.id}
                  active={service.active}
                />
                <EditServiceDialog
                  serviceId={service.id}
                  name={service.name}
                  durationMinutes={service.duration_minutes}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
