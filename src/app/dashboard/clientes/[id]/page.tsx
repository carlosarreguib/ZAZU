import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/dates/format";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { DeleteClientButton } from "@/components/clients/delete-client-button";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, businessId, business } = await requireBusiness();
  const timezone = business?.timezone ?? "Europe/Madrid";

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name, phone, notes")
    .eq("id", id)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!client) {
    notFound();
  }

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, starts_at, status, services(name)")
    .eq("business_id", businessId)
    .eq("client_id", id)
    .order("starts_at", { ascending: false });

  const now = new Date().toISOString();
  const upcoming = (appointments ?? []).filter((a) => a.starts_at >= now);
  const past = (appointments ?? []).filter((a) => a.starts_at < now);

  const statusLabels: Record<string, string> = {
    scheduled: "Pendiente",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    completed: "Completada",
    no_show: "No presentado",
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.full_name}</h1>
          <p className="text-muted-foreground">{client.phone}</p>
          {client.notes ? (
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              {client.notes}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <EditClientDialog
            clientId={client.id}
            fullName={client.full_name}
            phone={client.phone}
            notes={client.notes}
          />
          <DeleteClientButton clientId={client.id} />
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Próximas citas</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tiene próximas citas.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((appt) => (
              <li
                key={appt.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
              >
                <span>{formatDateTime(appt.starts_at, timezone)}</span>
                <span className="text-muted-foreground">
                  {appt.services?.name ?? "—"} ·{" "}
                  {statusLabels[appt.status] ?? appt.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Historial de citas</h2>
        {past.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tiene citas pasadas.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {past.map((appt) => (
              <li
                key={appt.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
              >
                <span>{formatDateTime(appt.starts_at, timezone)}</span>
                <span className="text-muted-foreground">
                  {appt.services?.name ?? "—"} ·{" "}
                  {statusLabels[appt.status] ?? appt.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
